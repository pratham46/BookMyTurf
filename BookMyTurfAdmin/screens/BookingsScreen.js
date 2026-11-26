import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { errorText, myPitches, myTurf, pb, shiftDate, todayIST } from '../auth'
import { Button, Chip, ErrorState, Loading, StatusPill } from '../ui/kit'
import { C, F, dateParts, money, slotLabel } from '../ui/theme'

// Owner view: slot board for a date (one turf at a time), and bookings to confirm (mark paid) or reject.
export default function BookingsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const [turf, setTurf] = useState(null)
  const [pitches, setPitches] = useState([])
  const [pitchId, setPitchId] = useState(null) // turf shown on the slot board
  const [date, setDate] = useState(todayIST())
  const [mode, setMode] = useState('date') // 'date' | 'pending'
  const [list, setList] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Dashboard's "payments to verify" opens this tab in pending mode.
  useEffect(() => {
    if (route.params?.mode) { setMode(route.params.mode); navigation.setParams({ mode: undefined }) }
  }, [route.params?.mode])

  const load = useCallback(async () => {
    try {
      const col = pb.collection('bookings')
      const filter = mode === 'pending' ? 'status = "pending"' : pb.filter('date = {:date}', { date })
      const t = await myTurf()
      const [ps, items, pend] = await Promise.all([
        myPitches(t.id),
        col.getFullList({ filter, sort: mode === 'pending' ? 'date,slot' : 'slot,-created' }),
        col.getList(1, 1, { filter: 'status = "pending"' }),
      ])
      setTurf(t)
      setPitches(ps)
      setPitchId((cur) => (ps.some((p) => p.id === cur) ? cur : ps[0]?.id || null))
      setList(items)
      setPendingCount(pend.totalItems)
      setError('')
    } catch (e) {
      setError(errorText(e))
    }
  }, [date, mode])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const setStatus = async (b, status) => {
    setBusyId(b.id)
    try {
      await pb.collection('bookings').update(b.id, { status })
      await load()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusyId(null)
    }
  }

  const today = todayIST()
  const booked = new Set((list || []).filter((b) => b.status !== 'rejected' && b.pitch === pitchId).map((b) => b.slot))
  const pitchName = Object.fromEntries(pitches.map((p) => [p.id, p.name]))
  const slots = turf?.slots || []

  return (
    <View style={{ flex: 1, backgroundColor: C.field }}>
      <View style={[s.header, { paddingTop: insets.top + 18 }]}>
        <Text style={s.h1}>Bookings</Text>
        <View style={s.seg} accessibilityRole="tablist">
          {[['date', 'By date'], ['pending', `To verify (${pendingCount})`]].map(([k, label]) => (
            <Pressable key={k} onPress={() => { setList(null); setMode(k) }} style={[s.segBtn, mode === k && s.segOn]}
              accessibilityRole="tab" accessibilityState={{ selected: mode === k }}>
              <Text style={[s.segText, mode === k && { color: C.ink }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {mode === 'date' && (
          <View style={s.dateRow}>
            <Pressable onPress={() => { setList(null); setDate(shiftDate(date, -1)) }} style={s.arrow} accessibilityLabel="Previous day">
              <Ionicons name="chevron-back" size={24} color={C.chalk} />
            </Pressable>
            <Pressable onPress={() => { setList(null); setDate(today) }} accessibilityLabel="Jump to today" style={{ alignItems: 'center' }}>
              <Text style={s.dateText}>{dateParts(date).long}</Text>
              <Text style={s.dateSub}>{date === today ? 'Today' : 'Tap for today'}</Text>
            </Pressable>
            <Pressable onPress={() => { setList(null); setDate(shiftDate(date, 1)) }} style={s.arrow} accessibilityLabel="Next day">
              <Ionicons name="chevron-forward" size={24} color={C.chalk} />
            </Pressable>
          </View>
        )}
      </View>

      {list === null ? (error ? <ErrorState message={error} onRetry={load} /> : <Loading />) : (
        <ScrollView contentContainerStyle={s.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}>
          {!!error && <Text style={s.err}>{error}</Text>}

          {mode === 'date' && (
            <>
              <View style={s.boardHead}>
                <Text style={s.h2}>Slot board</Text>
                <Text style={s.legend}>{booked.size} of {slots.length} booked</Text>
              </View>
              {pitches.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {pitches.map((p) => <Chip key={p.id} label={p.name} selected={p.id === pitchId} onPress={() => setPitchId(p.id)} />)}
                </ScrollView>
              )}
              <View style={s.board}>
                {slots.map((sl) => (
                  <View key={sl} style={[s.slot, booked.has(sl) && s.slotOn]}>
                    <Text style={[s.slotText, booked.has(sl) && { color: C.chalk }]}>{slotLabel(sl)}</Text>
                    <Text style={[s.slotSub, booked.has(sl) && { color: C.flood }]}>{booked.has(sl) ? 'Booked' : 'Free'}</Text>
                  </View>
                ))}
                {!slots.length && <Text style={s.legend}>No slots yet. Add them in the Turf tab.</Text>}
              </View>
              <Text style={[s.h2, { marginTop: 22 }]}>Bookings</Text>
            </>
          )}

          {list.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{mode === 'pending' ? 'All caught up' : 'No bookings'}</Text>
              <Text style={s.emptyText}>{mode === 'pending' ? 'No payments waiting for you to verify.' : 'Nobody has booked this day yet.'}</Text>
            </View>
          )}

          {list.map((b) => (
            <View key={b.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.slotBig}>{slotLabel(b.slot)}</Text>
                  {pitches.length > 1 && <Text style={s.pitch}>{pitchName[b.pitch] || 'Deleted turf'}</Text>}
                  {mode === 'pending' && <Text style={s.meta}>{dateParts(b.date).long}</Text>}
                </View>
                <StatusPill status={b.status} />
              </View>
              <Text style={s.who}>{b.customerName || b.customerEmail}</Text>
              <Text style={s.meta}>{b.sport} · {money(b.amount)}</Text>
              <Text style={s.meta}>{b.customerPhone ? `${b.customerPhone} · ` : ''}{b.customerEmail}</Text>
              <View style={s.ref}>
                <Text style={s.refLabel}>UPI ref</Text>
                <Text style={s.refValue} selectable>{b.upiRef}</Text>
              </View>
              <View style={s.actions}>
                {b.status !== 'paid' && <Button title="Mark paid" kind="dark" style={s.act} busy={busyId === b.id} onPress={() => setStatus(b, 'paid')} />}
                {b.status !== 'rejected' && <Button title="Reject" kind="ghost" style={s.act} disabled={busyId === b.id} onPress={() => setStatus(b, 'rejected')} />}
                {b.status !== 'pending' && <Button title="Undo" kind="ghost" style={s.act} disabled={busyId === b.id} onPress={() => setStatus(b, 'pending')} />}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, paddingHorizontal: 20, paddingBottom: 14 },
  h1: { fontFamily: F.display, fontSize: 34, color: C.chalk, marginBottom: 14 },
  seg: { flexDirection: 'row', backgroundColor: C.turfDeep, borderRadius: 10, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: C.flood },
  segText: { fontFamily: F.semi, fontSize: 15, color: '#BFD6C8' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  arrow: { padding: 8 },
  dateText: { fontFamily: F.display, fontSize: 22, color: C.chalk },
  dateSub: { fontFamily: F.body, fontSize: 13, color: '#BFD6C8' },
  body: { padding: 16, paddingBottom: 32, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  err: { fontFamily: F.medium, color: C.rejected },
  boardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink },
  legend: { fontFamily: F.body, fontSize: 14, color: C.muted },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { flexGrow: 1, flexBasis: '30%', backgroundColor: C.chalk, borderWidth: 1.5, borderColor: C.line, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10 },
  slotOn: { backgroundColor: C.turf, borderColor: C.turf },
  slotText: { fontFamily: F.displaySemi, fontSize: 17, color: C.ink },
  slotSub: { fontFamily: F.medium, fontSize: 12, color: C.muted },
  empty: { alignItems: 'center', padding: 28 },
  emptyTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  emptyText: { fontFamily: F.body, fontSize: 15, color: C.muted, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: C.chalk, borderRadius: 14, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  slotBig: { fontFamily: F.display, fontSize: 24, color: C.ink, lineHeight: 26 },
  pitch: { fontFamily: F.semi, fontSize: 14, color: C.turf, marginTop: 2 },
  who: { fontFamily: F.semi, fontSize: 17, color: C.ink },
  meta: { fontFamily: F.body, fontSize: 15, color: C.muted, marginTop: 1 },
  ref: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.field, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  refLabel: { fontFamily: F.medium, fontSize: 13, color: C.muted },
  refValue: { flex: 1, fontFamily: F.semi, fontSize: 16, color: C.ink, letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  act: { flex: 1, minHeight: 44 },
})
