import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { errorText, pb } from '../auth'
import { Button, ErrorState, Loading } from '../ui/kit'
import { C, F } from '../ui/theme'
import BookingTicket from './BookingTicket'

const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)

// The signed-in customer's bookings, split into upcoming (soonest first) and past (latest first).
export default function MyBookings({ navigation }) {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('upcoming')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await pb.collection('bookings').getFullList({ expand: 'turf,pitch', sort: 'date,slot' }))
      setError('')
    } catch (e) {
      setError(errorText(e))
    }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (items === null) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />

  const today = todayIST()
  const upcoming = items.filter((b) => b.date >= today)
  const past = items.filter((b) => b.date < today).reverse()
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <View style={{ flex: 1, backgroundColor: C.field }}>
      <View style={[s.header, { paddingTop: insets.top + 18 }]}>
        <Text style={s.h1}>Your bookings</Text>
        <View style={s.seg} accessibilityRole="tablist">
          {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([k, label]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[s.segBtn, tab === k && s.segOn]}
              accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
              <Text style={[s.segText, tab === k && { color: C.ink }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }}
        renderItem={({ item }) => <BookingTicket b={item} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{tab === 'upcoming' ? 'No games lined up' : 'No past games yet'}</Text>
            <Text style={s.emptyText}>{tab === 'upcoming' ? 'Find a turf and book your next slot.' : 'Games you have played show up here.'}</Text>
            {tab === 'upcoming' && <Button title="Find a turf" kind="dark" onPress={() => navigation.navigate('Turfs')} style={{ marginTop: 16, alignSelf: 'stretch' }} />}
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, paddingHorizontal: 20, paddingBottom: 16 },
  h1: { fontFamily: F.display, fontSize: 34, color: C.chalk, marginBottom: 14 },
  seg: { flexDirection: 'row', backgroundColor: C.turfDeep, borderRadius: 10, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: C.flood },
  segText: { fontFamily: F.semi, fontSize: 15, color: '#BFD6C8' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontFamily: F.display, fontSize: 26, color: C.ink },
  emptyText: { fontFamily: F.body, fontSize: 15, color: C.muted, marginTop: 4, textAlign: 'center' },
})
