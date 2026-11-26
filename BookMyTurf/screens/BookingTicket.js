import React from 'react'
import { Text, View } from 'react-native'
import { Stat, StatusPill, Ticket } from '../ui/kit'
import { C, F, dateParts, money, slotLabel } from '../ui/theme'

// One booking as a match ticket (used on the confirmation screen and in My Bookings).
export default function BookingTicket({ b, background, accent }) {
  const t = b.expand?.turf
  const p = b.expand?.pitch
  return (
    <Ticket title={t?.name || 'Turf'} subtitle={[p?.name, t?.area].filter(Boolean).join(' · ')} background={background} accent={accent}>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Stat label="Date" value={dateParts(b.date).long} />
        <Stat label="Time" value={slotLabel(b.slot)} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <Stat label="Sport" value={b.sport} />
        <Stat label="Amount" value={money(b.amount)} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusPill status={b.status} />
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>UPI ref {b.upiRef}</Text>
      </View>
    </Ticket>
  )
}
