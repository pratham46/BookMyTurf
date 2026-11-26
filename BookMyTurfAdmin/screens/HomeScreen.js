import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { errorText, myPitches, myTurf, pb, pitchReady, shiftDate, todayIST } from '../auth'
import { ErrorState, Loading, Stat } from '../ui/kit'
import { C, F, money } from '../ui/theme'

// Everything the dashboard shows, from the owner's turf and their last 7 days of bookings.
async function loadDashboard() {
  const today = todayIST()
  const turf = await myTurf()
  const [pitches, week, pending] = await Promise.all([
    myPitches(turf.id),
    pb.collection('bookings').getFullList({
      filter: pb.filter('date >= {:from} && date <= {:today} && status != "rejected"', { from: shiftDate(today, -6), today }),
      fields: 'date,status,amount',
    }),
    pb.collection('bookings').getList(1, 1, { filter: 'status = "pending"' }),
  ])
  return {
    turf,
    pitches,
    bookedToday: week.filter((b) => b.date === today).length,
    weekPaid: week.filter((b) => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0),
    pending: pending.totalItems,
  }
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try { setD(await loadDashboard()); setError('') } catch (e) { setError(errorText(e)) }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!d) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />
  const { turf } = d
  const slots = (turf.slots || []).length
  const ready = d.pitches.filter(pitchReady)
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

  // Setup rows double as the "manage" menu; each says what is missing.
  const rows = [
    { icon: 'football', title: 'Turfs and timings', ok: ready.length > 0 && slots > 0, go: () => navigation.navigate('Turf'),
      sub: !ready.length ? 'Add price and sports to a turf' : !slots ? 'Pick your slot timings'
        : `${plural(ready.length, 'turf')} · ${plural(slots, 'slot')} a day · from ${money(turf.price)}` },
    { icon: 'qr-code', title: 'UPI payments', sub: turf.upiId || 'Add the UPI ID players pay to', ok: !!turf.upiId, go: () => navigation.navigate('Upi') },
    { icon: 'images', title: 'Venue photos', sub: turf.gallery?.length ? plural(turf.gallery.length, 'photo') : 'Show players your venue', ok: !!turf.gallery?.length, go: () => navigation.navigate('Gallery') },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.field }} contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}>
      <View style={[s.header, { paddingTop: insets.top + 18 }]}>
        <Text style={s.kicker}>Your venue</Text>
        <Text style={s.h1} numberOfLines={2}>{turf.name || 'Unnamed turf'}</Text>
        <View style={s.liveRow}>
          <View style={[s.dot, { backgroundColor: turf.approved ? '#5BD08A' : C.flood }]} />
          <Text style={s.liveText}>{turf.approved ? 'Live: players can book' : 'Waiting for BookMyTurf approval'}</Text>
        </View>
      </View>

      <View style={s.body}>
        <View style={s.stats}>
          <Stat label="Booked today" value={`${d.bookedToday} / ${slots * ready.length}`} />
          <Stat label="To verify" value={String(d.pending)} />
          <Stat label="Paid, 7 days" value={money(d.weekPaid)} />
        </View>

        {d.pending > 0 && (
          <Pressable style={s.alert} accessibilityRole="button" onPress={() => navigation.navigate('Bookings', { mode: 'pending' })}>
            <Ionicons name="alert-circle" size={26} color={C.ink} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{d.pending} payment{d.pending > 1 ? 's' : ''} to verify</Text>
              <Text style={s.alertText}>Check the UPI reference in your bank app, then mark paid.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.ink} />
          </Pressable>
        )}

        <Text style={s.h2}>Manage</Text>
        <View style={s.card}>
          {rows.map((r, i) => (
            <Pressable key={r.title} onPress={r.go} accessibilityRole="button"
              style={({ pressed }) => [s.row, i > 0 && s.rowLine, pressed && { backgroundColor: C.field }]}>
              <View style={s.iconBox}><Ionicons name={r.icon} size={20} color={C.turf} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{r.title}</Text>
                <Text style={[s.rowSub, !r.ok && { color: C.pending }]} numberOfLines={1}>{r.sub}</Text>
              </View>
              <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={r.ok ? C.paid : '#B5BEB8'} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, paddingHorizontal: 20, paddingBottom: 46 },
  kicker: { fontFamily: F.semi, fontSize: 13, color: C.flood, textTransform: 'uppercase', letterSpacing: 1 },
  h1: { fontFamily: F.display, fontSize: 36, color: C.chalk, lineHeight: 38, marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  liveText: { fontFamily: F.medium, fontSize: 15, color: '#BFD6C8' },
  body: { paddingHorizontal: 16, marginTop: -30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  stats: { flexDirection: 'row', gap: 10, backgroundColor: C.chalk, borderRadius: 14, padding: 16 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.flood, borderRadius: 14, padding: 14, marginTop: 14 },
  alertTitle: { fontFamily: F.display, fontSize: 21, color: C.ink },
  alertText: { fontFamily: F.body, fontSize: 14, color: C.turfDeep },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: C.chalk, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowLine: { borderTopWidth: 1, borderColor: C.line },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E3EEE7', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  rowSub: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 1 },
})
