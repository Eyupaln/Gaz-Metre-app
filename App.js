import { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, ImageBackground, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, StatusBar,
} from "react-native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts, Manrope_700Bold, Manrope_600SemiBold, Manrope_500Medium } from "@expo-google-fonts/manrope";
import { onValue, ref } from "firebase/database";
import { database } from "./firebaseConfig";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import QualityTime from "./undraw_quality-time_h2b9.svg";
import AnalysisSvg from "./undraw_key-insights_ex8y.svg";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

const C = {
  bg: "#F7FAF9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E4EDEA",
  borderDark: "#C8DFDA",
  text: "#1A2E2A",
  muted: "#6B8F89",
  mutedLight: "#A8C4BF",
  normal: "#16A34A",
  normalBg: "#DCFCE7",
  warning: "#D97706",
  warningBg: "#FEF3C7",
  critical: "#DC2626",
  criticalBg: "#FEE2E2",
  accent: "#059669",
  accentLight: "#ECFDF5",
};

const ONBOARDING = [
  { key: "welcome", title: "Evini Koru", subtitle: "Gaz ve hava kalitesini tek panelden canlı takip et.", image: require("./home.jpg") },
  { key: "status", title: "Anlık Durum", subtitle: "Ortamının güvenlik seviyesini saniyeler içinde gör.", image: null },
  { key: "sensors", title: "Sensör Analizi", subtitle: "MQ-2 ve MQ-135 verilerini detaylıca incele.", image: null },
];

function meta(status) {
  if (status === "Kritik") return { color: C.critical, bg: C.criticalBg, icon: "alert-triangle" };
  if (status === "Uyarı") return { color: C.warning, bg: C.warningBg, icon: "alert-circle" };
  return { color: C.normal, bg: C.normalBg, icon: "check-circle" };
}

function pulseDur(status) {
  if (status === "Kritik") return 400;
  if (status === "Uyarı") return 900;
  return 1800;
}

async function registerPush() {
  if (!Device.isDevice) return;
  const { status: ex } = await Notifications.getPermissionsAsync();
  let final = ex;
  if (ex !== "granted") { const { status } = await Notifications.requestPermissionsAsync(); final = status; }
  if (final !== "granted") return;
  await Notifications.setNotificationChannelAsync("kritik-uyari", {
    name: "Kritik Uyarılar",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    sound: "default",
  });
}

export default function App() {
  const [fontsLoaded] = useFonts({ Manrope_700Bold, Manrope_600SemiBold, Manrope_500Medium });
  const [sensor, setSensor] = useState({ mq2: "--", mq135: "--", durum: "Bağlanıyor", saat: "--:--:--" });
  const [notifOk, setNotifOk] = useState(false);
  const [log, setLog] = useState([]);
  const [onboarding, setOnboarding] = useState(true);
  const [obStep, setObStep] = useState(0);
  const [booting, setBooting] = useState(true);

  const scrollRef = useRef(null);
  const obX = useRef(new Animated.Value(0)).current;
  const obOp = useRef(new Animated.Value(1)).current;
  const prevStatus = useRef("");
  const latestSensor = useRef(sensor);
  const logTimer = useRef(null);
  const pulseScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOp = useRef(new Animated.Value(0.5)).current;
  const pulseLoop = useRef(null);



  useEffect(() => {
    AsyncStorage.getItem("ob_v1")
      .then(v => setOnboarding(v !== "true"))
      .catch(() => setOnboarding(true))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    registerPush()
      .then(async () => { const p = await Notifications.getPermissionsAsync(); setNotifOk(p.granted); })
      .catch(() => setNotifOk(false));
  }, []);

  useEffect(() => {
    return onValue(ref(database, "canli_gaz"), async (snap) => {
      const d = snap.val(); if (!d) return;
      const ns = d.durum || "Normal";
      const saat = d.saat || "--:--:--";
      setSensor({ mq2: d.mq2 ?? "--", mq135: d.mq135 ?? "--", durum: ns, saat });

      if (prevStatus.current !== "Kritik" && ns === "Kritik") {
        await Notifications.scheduleNotificationAsync({
          content: { title: "⚠ Kritik Gaz!", body: `MQ-2: ${d.mq2} | MQ-135: ${d.mq135}`, sound: "default" },
          trigger: null,
        });
      }
      prevStatus.current = ns;
    });
  }, []);

  useEffect(() => { latestSensor.current = sensor; }, [sensor]);

  useEffect(() => {
    logTimer.current = setInterval(() => {
      setLog(prev => [{ ...latestSensor.current }, ...prev].slice(0, 20));
    }, 30000);
    return () => logTimer.current && clearInterval(logTimer.current);
  }, []);

  useEffect(() => {
    if (pulseLoop.current) pulseLoop.current.stop();
    pulseScale.setValue(1); ringScale.setValue(1); ringOp.setValue(0.5);
    const h = Math.max(100, Math.floor(pulseDur(sensor.durum) / 2));
    pulseLoop.current = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 1.06, duration: h, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1.22, duration: h * 2, useNativeDriver: true }),
        Animated.timing(ringOp, { toValue: 0, duration: h * 2, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 1, duration: h, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ringOp, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ]),
    ]));
    pulseLoop.current.start();
    return () => pulseLoop.current && pulseLoop.current.stop();
  }, [sensor.durum]);



  useEffect(() => {
    obX.setValue(30); obOp.setValue(0);
    Animated.parallel([
      Animated.timing(obX, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(obOp, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [obStep]);

  const m = meta(sensor.durum);
  const done = async () => { try { await AsyncStorage.setItem("ob_v1", "true"); } catch { } setOnboarding(false); setObStep(0); };

  if (booting || !fontsLoaded) return <View style={s.root} />;

  /* ── ONBOARDING ── */
  if (onboarding) {
    const step = ONBOARDING[obStep];
    const isLast = obStep === ONBOARDING.length - 1;
    const next = () => isLast ? done() : setObStep(p => p + 1);
    
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        
        {/* Sadece Resimler/Görseller Animasyonlu */}
        {obStep === 0 && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: obOp, transform: [{ translateX: obX }] }]}>
            <ImageBackground source={require("./home.jpg")} style={{ flex: 1 }} resizeMode="cover" />
          </Animated.View>
        )}
        
        {obStep > 0 && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#009760" }]} />
        )}

        <LinearGradient 
          colors={obStep === 0 ? ["rgba(0, 0, 0, 0.01)", "rgba(0, 0, 0, 1)"] : ["rgba(0, 0, 0, 0.01)", "rgba(0, 0, 0, 0.8)"]} 
          style={StyleSheet.absoluteFill} 
          pointerEvents="none" 
        />

        {/* Yazılar ve Kontroller Sabit */}
        <View style={s.obOverlay}>
          {obStep > 0 && (
            <Animated.View style={[s.obIllustration, { opacity: obOp, transform: [{ translateX: obX }] }]}>
              {obStep === 1 ? <QualityTime width={260} height={260} /> : <AnalysisSvg width={260} height={260} />}
            </Animated.View>
          )}

          <Text style={[s.obTitle, { color: "#fff" }]}>{step.title}</Text>
          <Text style={[s.obSub, { color: "#fff" }]}>{step.subtitle}</Text>
          <View style={s.obDots}>
            {ONBOARDING.map((o, i) => <View key={o.key} style={[s.obDot, i === obStep && s.obDotActive]} />)}
          </View>
          <TouchableOpacity style={s.obBtn} onPress={next}>
            <LinearGradient colors={[C.accent, "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.obBtnGrad}>
              <Text style={s.obBtnText}>{isLast ? "Başlayalım" : "İleri"}</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <View style={[s.root, { paddingTop: Constants.statusBarHeight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View>

            <Text style={s.pageTitle}>Gaz Takip Paneli</Text>
          </View>

        </View>

        {/* Durum Kartı */}
        <View style={[s.statusCard, { borderColor: m.color + "30", backgroundColor: "#fff" }]}>
          {/* Üst satır: label + saat */}
          <View style={s.statusTopRow}>
            <Text style={s.statusLabel}>Ortam Durumu</Text>
            <View style={s.statusTimeRow}>
              <Feather name="clock" size={11} color={C.muted} />
              <Text style={s.statusTime}> {sensor.saat}</Text>
            </View>
          </View>

          {/* Durum yazısı */}
          <Text style={[s.statusValue, { color: m.color }]}>{sensor.durum}</Text>

          {/* Büyük ikon — ortada */}
          <View style={s.bigIconWrap}>
            <View style={s.bigIconRing}>
              <Animated.View style={[s.bigRingPulse, { borderColor: m.color, transform: [{ scale: ringScale }], opacity: ringOp }]} />
              <Animated.View style={[s.bigCircle, { backgroundColor: m.color + "20", borderColor: m.color + "50", transform: [{ scale: pulseScale }] }]}>
                <Feather name={m.icon} size={52} color={m.color} />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Sensör Kartları */}
        <View style={s.metricsRow}>
          {/* MQ-2 */}
          <View style={[s.metricCard, { borderColor: m.color + "30" }]}>
            <View style={s.metricTop}>
              <View style={[s.metricIconWrap, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name="smoke-detector" size={20} color={m.color} />
              </View>
              <View style={[s.metricBadge, { backgroundColor: m.bg }]}>
                <Text style={[s.metricBadgeText, { color: m.color }]}>MQ-2</Text>
              </View>
            </View>
            <Text style={s.metricLabel}>Yanıcı Gaz</Text>
            <Text style={[s.metricValue, { color: m.color }]}>{sensor.mq2}</Text>
          </View>

          {/* MQ-135 */}
          <View style={[s.metricCard, { borderColor: m.color + "30" }]}>
            <View style={s.metricTop}>
              <View style={[s.metricIconWrap, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name="air-filter" size={20} color={m.color} />
              </View>
              <View style={[s.metricBadge, { backgroundColor: m.bg }]}>
                <Text style={[s.metricBadgeText, { color: m.color }]}>MQ-135</Text>
              </View>
            </View>
            <Text style={s.metricLabel}>Hava Kalitesi</Text>
            <Text style={[s.metricValue, { color: m.color }]}>{sensor.mq135}</Text>
          </View>
        </View>

        {/* Bildirim Şeridi */}
        <View style={[s.infoStrip, { backgroundColor: notifOk ? C.normalBg : C.criticalBg, borderColor: notifOk ? C.normal + "30" : C.critical + "30" }]}>
          <Feather name={notifOk ? "bell" : "bell-off"} size={16} color={notifOk ? C.normal : C.critical} />
          <Text style={[s.infoText, { color: notifOk ? C.normal : C.critical }]}>
            {notifOk ? "Bildirimler açık — kritik uyarılar iletilecek" : "Bildirim izni kapalı"}
          </Text>
        </View>

        {/* Log */}
        <View style={s.logSection}>
          <View style={s.logHeader}>
            <View style={s.logHeaderLeft}>
              <Feather name="list" size={16} color={C.text} style={{ marginRight: 8 }} />
              <Text style={s.logTitle}>Son Kayıtlar</Text>
            </View>
            <View style={s.logChip}>
              <Feather name="refresh-cw" size={10} color={C.muted} style={{ marginRight: 4 }} />
              <Text style={s.logChipText}>Her 30 sn</Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
            {log.length === 0 ? (
              <View style={s.emptyLog}>
                <Feather name="inbox" size={28} color={C.mutedLight} />
                <Text style={s.emptyText}>Henüz kayıt yok{"\n"}30 saniyede bir güncellenir</Text>
              </View>
            ) : (
              log.map((item, i) => {
                const lm = meta(item.durum);
                return (
                  <View key={`${item.saat}-${i}`} style={[s.logRow, { borderLeftColor: lm.color }]}>
                    <View style={s.logLeft}>
                      <View style={[s.logIconWrap, { backgroundColor: lm.bg }]}>
                        <Feather name={lm.icon} size={13} color={lm.color} />
                      </View>
                      <Text style={s.logTime}>{item.saat}</Text>
                      <View style={[s.logBadge, { backgroundColor: lm.bg }]}>
                        <Text style={[s.logBadgeText, { color: lm.color }]}>{item.durum}</Text>
                      </View>
                    </View>
                    <View style={s.logRight}>
                      <View style={s.logValRow}>
                        <Text style={s.logValLabel}>MQ-2</Text>
                        <Text style={s.logVal}>{item.mq2}</Text>
                      </View>
                      <View style={s.logValRow}>
                        <Text style={s.logValLabel}>MQ-135</Text>
                        <Text style={s.logVal}>{item.mq135}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Bağlantıyı Kes */}
        <TouchableOpacity
          onPress={() => Alert.alert("Emin misiniz?", "Kombi bağlantısı kesilecek.", [
            { text: "İptal", style: "cancel" },
            { text: "Kes", style: "destructive" },
          ])}
          activeOpacity={0.85}
        >
          <View style={s.disconnectBtn}>
            <Feather name="power" size={18} color={C.critical} />
            <Text style={s.disconnectText}>Kombi Bağlantısını Kes</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

/* ════ STYLES ════ */
const sh = { shadowColor: "#0D2420", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 36 },

  /* Header */
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 18 },
  eyebrow: { fontSize: 12, color: C.muted, fontFamily: "Manrope_600SemiBold", marginBottom: 3, letterSpacing: 0.5 },
  pageTitle: { fontSize: 26, fontFamily: "Manrope_700Bold", color: C.text },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.surface, borderWidth: 1.1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, ...sh },
  liveDot: { width: 7, height: 7, borderRadius: 999 },
  liveText: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 1 },

  /* Status Card */
  statusCard: { borderRadius: 10, borderWidth: 0.75, padding: 20, marginBottom: 14, ...sh },
  statusTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statusLabel: { fontSize: 11, color: C.muted, fontFamily: "Manrope_600SemiBold", textTransform: "uppercase", letterSpacing: 1 , },
  statusValue: { fontSize: 38, fontFamily: "Manrope_700Bold", marginBottom: 20 },
  statusTimeRow: { flexDirection: "row", alignItems: "center" },
  statusTime: { fontSize: 12, color: C.muted, fontFamily: "Manrope_500Medium" },

  /* Big Icon */
  bigIconWrap: { alignItems: "center", paddingBottom: 4 },
  bigIconRing: { width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  bigRingPulse: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 0.75 },
  bigCircle: { width: 108, height: 108, borderRadius: 54, alignItems: "center", justifyContent: "center", borderWidth: 0.75 },

  /* Metric Cards */
  metricsRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, backgroundColor: C.surface, borderRadius: 10, borderWidth: 0.75, padding: 16, ...sh },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  metricIconWrap: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metricBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  metricBadgeText: { fontSize: 11, fontFamily: "Manrope_700Bold" },
  metricLabel: { fontSize: 12, color: C.muted, fontFamily: "Manrope_600SemiBold", marginBottom: 4 },
  metricValue: { fontSize: 38, fontFamily: "Manrope_700Bold" },

  /* Info Strip */
  infoStrip: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 0.75, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 14 },
  infoText: { fontSize: 13, fontFamily: "Manrope_500Medium", flex: 1 },

  /* Log */
  logSection: { backgroundColor: C.surface, borderRadius: 10, padding: 18, borderWidth: 0.5, borderColor: C.border, marginBottom: 14, ...sh },
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  logHeaderLeft: { flexDirection: "row", alignItems: "center" },
  logTitle: { fontSize: 15, fontFamily: "Manrope_700Bold", color: C.text },
  logChip: { flexDirection: "row", alignItems: "center", backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5, borderColor: C.border },
  logChipText: { fontSize: 11, color: C.muted, fontFamily: "Manrope_600SemiBold" },
  emptyLog: { paddingVertical: 32, alignItems: "center", gap: 10 },
  emptyText: { color: C.muted, fontSize: 13, fontFamily: "Manrope_500Medium", textAlign: "center", lineHeight: 20 },
  logRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 8, borderLeftWidth: 3 },
  logLeft: { gap: 5 },
  logIconWrap: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  logTime: { fontSize: 13, color: C.text, fontFamily: "Manrope_600SemiBold" },
  logBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  logBadgeText: { fontSize: 11, fontFamily: "Manrope_700Bold" },
  logRight: { gap: 6, alignItems: "flex-end" },
  logValRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  logValLabel: { fontSize: 11, color: C.muted, fontFamily: "Manrope_600SemiBold", width: 48, textAlign: "right" },
  logVal: { fontSize: 13, color: C.text, fontFamily: "Manrope_700Bold" },

  /* Disconnect */
  disconnectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 18, borderWidth: 0.75, borderColor: C.critical + "40", ...sh },
  disconnectText: { color: C.critical, fontSize: 15, fontFamily: "Manrope_700Bold" },

  /* Onboarding */
  obOverlay: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 52 },
  obSolid: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingBottom: 52, justifyContent: "flex-end" },
  obIllustration: { alignItems: "center", marginBottom: 24 },
  obChip: { alignSelf: "center", backgroundColor: C.accentLight, borderWidth: 1, borderColor: C.accent + "40", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  obChipText: { color: C.accent, fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 1.5 },
  obTitle: { fontSize: 36, fontFamily: "Manrope_700Bold", color: C.text, marginBottom: 12, textAlign: "center" },
  obSub: { fontSize: 16, fontFamily: "Manrope_500Medium", color: C.muted, marginBottom: 32, lineHeight: 24, textAlign: "center" },
  obDots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  obDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: C.border },
  obDotActive: { width: 24, backgroundColor: C.accent },
  obBtn: { borderRadius: 15, overflow: "hidden" },
  obBtnGrad: { flexDirection: "row", paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  obBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
