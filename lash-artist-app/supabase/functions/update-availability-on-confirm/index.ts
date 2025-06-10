import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Обработка preflight-запроса для CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record: booking } = await req.json();

    // Проверяем, что это подтверждение бронирования
    if (booking.status !== 'confirmed') {
      console.log(`Booking status is '${booking.status}', not 'confirmed'. Exiting.`);
      return new Response(JSON.stringify({ message: 'Not a confirmation, skipping.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // Создаем админский клиент Supabase, который может обходить RLS-политики
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing confirmed booking ID: ${booking.id}`);
    console.log(`Date: ${booking.booking_date}, Start: ${booking.booking_start_time}, End: ${booking.booking_end_time}`);

    // Ищем подходящий слот в таблице availability
    const { data: availableSlots, error: slotError } = await supabaseAdmin
      .from('availability')
      .select('id')
      .eq('date', booking.booking_date)
      .gte('end_time', booking.booking_end_time)
      .lte('start_time', booking.booking_start_time)
      .eq('is_booked', false);

    if (slotError) throw slotError;
    
    if (!availableSlots || availableSlots.length === 0) {
        const message = `No available slot found for booking ${booking.id} on ${booking.booking_date} from ${booking.booking_start_time} to ${booking.booking_end_time}.`;
        console.warn(message);
        // Важно вернуть успешный ответ, чтобы триггер не пытался повторить операцию
        return new Response(JSON.stringify({ warning: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, 
        });
    }

    const slotToUpdate = availableSlots[0];
    console.log(`Found matching availability slot ID: ${slotToUpdate.id}. Updating...`);

    // Обновляем найденный слот, устанавливая is_booked = true
    const { error: updateError } = await supabaseAdmin
      .from('availability')
      .update({ is_booked: true })
      .eq('id', slotToUpdate.id);

    if (updateError) throw updateError;
    
    console.log(`Slot ${slotToUpdate.id} successfully marked as booked.`);

    return new Response(JSON.stringify({ success: true, updatedSlotId: slotToUpdate.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing booking confirmation:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});