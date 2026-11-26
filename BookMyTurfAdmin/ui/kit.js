import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { C, F, STATUS } from './theme'

// kind: 'primary' (floodlight), 'dark' (turf), 'ghost' (outline), 'ghostLight' (outline on green)
export function Button({ title, onPress, kind = 'primary', busy, disabled, style, icon }) {
  const k = btn[kind]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={({ pressed }) => [s.btn, k.box, (disabled || busy) && { opacity: 0.45 }, pressed && { opacity: 0.8 }, style]}
    >
      {busy ? <ActivityIndicator color={k.text.color} /> : (
        <View style={s.row}>
          {icon}
          <Text style={[s.btnText, k.text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  )
}

export function Chip({ label, selected, onPress, disabled, dark }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[s.chip, dark && s.chipDark, selected && s.chipOn, disabled && s.chipOff]}
    >
      <Text style={[s.chipText, dark && { color: C.chalk }, selected && { color: C.ink }, disabled && s.chipTextOff]}>{label}</Text>
    </Pressable>
  )
}

export function Field({ label, style, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <TextInput placeholderTextColor="#8C978F" style={[s.input, props.editable === false && { opacity: 0.6 }, style]} {...props} />
    </View>
  )
}

export function StatusPill({ status }) {
  const st = STATUS[status]
  return <Text style={[s.pill, { color: st.color, backgroundColor: st.bg }]}>{st.label}</Text>
}

// A match ticket: green header with turf, perforated tear line, details below.
export function Ticket({ title, subtitle, children, background = C.field, accent }) {
  return (
    <View style={s.ticket}>
      <View style={[s.ticketTop, accent && { backgroundColor: C.flood }]}>
        <Text style={[s.ticketTitle, accent && { color: C.ink }]} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={[s.ticketSub, accent && { color: C.turfDeep }]}>{subtitle}</Text>}
      </View>
      <View style={s.tear}>
        <View style={[s.notch, { left: -11, backgroundColor: background }]} />
        <View style={s.dash} />
        <View style={[s.notch, { right: -11, backgroundColor: background }]} />
      </View>
      <View style={s.ticketBody}>{children}</View>
    </View>
  )
}

export function Stat({ label, value, style }) {
  return (
    <View style={[{ flex: 1 }, style]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  )
}

export function Center({ children }) {
  return <View style={s.center}>{children}</View>
}

export function Loading() {
  return <Center><ActivityIndicator size="large" color={C.turf} /></Center>
}

export function ErrorState({ message, onRetry }) {
  return (
    <Center>
      <Text style={s.errTitle}>Couldn't load this</Text>
      <Text style={s.errText}>{message}</Text>
      {onRetry && <Button title="Try again" kind="dark" onPress={onRetry} style={{ marginTop: 16, alignSelf: 'stretch' }} />}
    </Center>
  )
}

const btn = {
  primary: { box: { backgroundColor: C.flood }, text: { color: C.ink } },
  dark: { box: { backgroundColor: C.turf }, text: { color: C.chalk } },
  ghost: { box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.line }, text: { color: C.ink } },
  ghostLight: { box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' }, text: { color: C.chalk } },
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { minHeight: 52, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: F.semi, fontSize: 17 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.chalk },
  chipDark: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.35)' },
  chipOn: { backgroundColor: C.flood, borderColor: C.flood },
  chipOff: { backgroundColor: '#E9EDEA', borderColor: '#E9EDEA' },
  chipText: { fontFamily: F.medium, fontSize: 15, color: C.ink },
  chipTextOff: { color: '#9AA49E', textDecorationLine: 'line-through' },
  label: { fontFamily: F.medium, fontSize: 14, color: C.muted, marginBottom: 6 },
  input: { fontFamily: F.body, fontSize: 17, color: C.ink, backgroundColor: C.chalk, borderWidth: 1.5, borderColor: C.line, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  pill: { alignSelf: 'flex-start', fontFamily: F.semi, fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  ticket: { backgroundColor: C.chalk, borderRadius: 14, overflow: 'hidden' },
  ticketTop: { backgroundColor: C.turf, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  ticketTitle: { fontFamily: F.display, fontSize: 26, color: C.chalk, lineHeight: 28 },
  ticketSub: { fontFamily: F.body, fontSize: 15, color: '#BFD6C8', marginTop: 2 },
  tear: { height: 22, justifyContent: 'center', backgroundColor: C.chalk },
  notch: { position: 'absolute', top: 0, width: 22, height: 22, borderRadius: 11 },
  dash: { marginHorizontal: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: C.line },
  ticketBody: { paddingHorizontal: 18, paddingBottom: 18 },
  statLabel: { fontFamily: F.body, fontSize: 13, color: C.muted },
  statValue: { fontFamily: F.displaySemi, fontSize: 20, color: C.ink, marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.field },
  errTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  errText: { fontFamily: F.body, fontSize: 15, color: C.muted, textAlign: 'center', marginTop: 6 },
})
