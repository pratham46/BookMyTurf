import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { errorText, pb } from '../auth'
import { Button, ErrorState, Loading } from '../ui/kit'
import { C, F } from '../ui/theme'
import BookingTicket from './BookingTicket'

// Shown right after booking: the ticket plus what happens next.
export default function BookingDoneScreen({ navigation, route }) {
  const { bookingId } = route.params
  const insets = useSafeAreaInsets()
  const [b, setB] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => pb.collection('bookings').getOne(bookingId, { expand: 'turf,pitch' }).then(setB, (e) => setError(errorText(e))), [bookingId])
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!b) return error ? <ErrorState message={error} onRetry={() => { setError(''); load() }} /> : <Loading />

  const heading = { pending: 'Slot requested', paid: "You're booked", rejected: 'Booking rejected' }[b.status]
  const next = {
    pending: 'The turf owner is checking your UPI payment. Your slot is held for you, and it turns to Confirmed in Bookings once they approve it.',
    paid: 'Your payment is confirmed. Show this ticket at the turf.',
    rejected: 'The turf owner could not match your payment. Contact the turf with your UPI reference.',
  }[b.status]

  return (
    <ScrollView style={{ backgroundColor: C.turf }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.flood}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}>
      <Text style={s.h1}>{heading}</Text>
      <Text style={s.p}>{next}</Text>
      <View style={{ marginTop: 22 }}>
        <BookingTicket b={b} background={C.turf} accent />
      </View>
      <Button title="See my bookings" onPress={() => navigation.navigate('Main', { screen: 'Bookings' })} style={{ marginTop: 24 }} />
      <Button title="Back to turfs" kind="ghostLight" onPress={() => navigation.navigate('Main', { screen: 'Turfs' })}
        style={{ marginTop: 10 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 20, maxWidth: 520, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: F.display, fontSize: 40, color: C.chalk, lineHeight: 42 },
  p: { fontFamily: F.body, fontSize: 16, color: '#BFD6C8', marginTop: 8, lineHeight: 23 },
})
