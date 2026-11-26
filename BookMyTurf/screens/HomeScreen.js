import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { errorText, fileUrl, pb, useAuth } from '../auth'
import { Chip, ErrorState, Loading } from '../ui/kit'
import { C, F, money } from '../ui/theme'

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [turfs, setTurfs] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [q, setQ] = useState('')
  const [sport, setSport] = useState('')

  const load = useCallback(async () => {
    try {
      setTurfs(await pb.collection('turfs').getFullList({ filter: 'approved = true', sort: 'name' }))
      setError('')
    } catch (e) {
      setError(errorText(e))
    }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const sports = useMemo(() => [...new Set((turfs || []).flatMap((t) => t.sports || []))].sort(), [turfs])
  const shown = (turfs || []).filter((t) =>
    (!sport || (t.sports || []).includes(sport)) &&
    (!q.trim() || `${t.name} ${t.area} ${t.address}`.toLowerCase().includes(q.trim().toLowerCase())))

  if (turfs === null && !error) return <Loading />
  if (turfs === null) return <ErrorState message={error} onRetry={load} />

  const firstName = (user?.name || '').split(' ')[0]

  return (
    <FlatList
      style={{ backgroundColor: C.field }}
      data={shown}
      keyExtractor={(t) => t.id}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.turf}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={[s.header, { paddingTop: insets.top + 18 }]}>
          <Text style={s.hello}>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Text>
          <Text style={s.headline}>where are you playing?</Text>
          <View style={s.search}>
            <Ionicons name="search" size={20} color={C.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search by turf or area" placeholderTextColor="#8C978F"
              style={s.searchInput} returnKeyType="search" autoCorrect={false} accessibilityLabel="Search turfs" />
            {!!q && <Ionicons name="close-circle" size={20} color={C.muted} onPress={() => setQ('')} accessibilityLabel="Clear search" />}
          </View>
          {sports.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginTop: 14, marginRight: -20 }}>
              <Chip dark label="All sports" selected={!sport} onPress={() => setSport('')} />
              {sports.map((sp) => <Chip dark key={sp} label={sp} selected={sport === sp} onPress={() => setSport(sport === sp ? '' : sp)} />)}
            </ScrollView>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{turfs.length ? 'No turfs match that' : 'No turfs listed yet'}</Text>
          <Text style={s.emptyText}>{turfs.length ? 'Try another area or sport.' : 'Pull down to refresh. New turfs appear here as soon as they go live.'}</Text>
        </View>
      }
      renderItem={({ item: t }) => (
        <Pressable onPress={() => navigation.navigate('Turf', { id: t.id })} style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
          accessibilityRole="button" accessibilityLabel={`${t.name}, ${t.area}, ${money(t.price)} per slot`}>
          {t.cover
            ? <Image source={{ uri: fileUrl(t, t.cover, '800x450') }} style={s.photo} />
            : <View style={[s.photo, { backgroundColor: '#CFD8D1' }]} />}
          <View style={s.cardBody}>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={2}>{t.name}</Text>
              <View style={s.areaRow}>
                <Ionicons name="location-outline" size={15} color={C.muted} />
                <Text style={s.area}>{t.area}</Text>
              </View>
              <Text style={s.sports}>{(t.sports || []).join(', ')}</Text>
            </View>
            <View style={s.priceBox}>
              <Text style={s.price}>{money(t.price)}</Text>
              <Text style={s.per}>from, per slot</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, paddingHorizontal: 20, paddingBottom: 22, marginBottom: 16, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  hello: { fontFamily: F.body, fontSize: 17, color: '#BFD6C8' },
  headline: { fontFamily: F.display, fontSize: 34, color: C.chalk, lineHeight: 36, marginBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.chalk, borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontFamily: F.body, fontSize: 17, color: C.ink, paddingVertical: 12 },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: C.chalk, borderRadius: 16, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 9 },
  cardBody: { flexDirection: 'row', padding: 14, gap: 12 },
  name: { fontFamily: F.display, fontSize: 24, color: C.ink, lineHeight: 26 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  area: { fontFamily: F.medium, fontSize: 15, color: C.muted },
  sports: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 4 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontFamily: F.display, fontSize: 26, color: C.turf },
  per: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: -2 },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  emptyText: { fontFamily: F.body, fontSize: 15, color: C.muted, textAlign: 'center', marginTop: 4 },
})
