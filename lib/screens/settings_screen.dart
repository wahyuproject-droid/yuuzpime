import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../helpers/webview_manager.dart';
import '../helpers/update_manager.dart';
import '../utils/constants.dart';
import '../widgets/tako_scaffold.dart';
import '../widgets/yuuz_brand.dart';
import '../widgets/update_alert_dialog.dart';
import '../utils/routes.dart';

class SettingScreen extends StatefulWidget {
  const SettingScreen({super.key});
  @override
  State<SettingScreen> createState() => _SettingScreenState();
}
class _SettingScreenState extends State<SettingScreen> {
  bool _auto = true, _intro = true;
  bool _loaded = false;
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try { final p = await SharedPreferences.getInstance(); if (mounted) setState(() { _auto = p.getBool('yuuz_auto_update') ?? true; _intro = p.getBool('yuuz_intro') ?? true; }); }
    catch (_) {}
    finally { if (mounted) setState(() => _loaded = true); }
  }
  Future<void> _save(String key, bool value) async {
    try {
      final p = await SharedPreferences.getInstance();
      if (!await p.setBool(key, value)) throw StateError('Settings not saved');
      if (mounted) setState(() { if (key == 'yuuz_intro') { _intro = value; } else { _auto = value; } });
    } catch (_) { if (mounted) Get.snackbar('Pengaturan', 'Gagal menyimpan. Coba lagi.'); }
  }
  Future<void> _check() async {
    final m = Get.find<UpdateManager>();
    if (m.status == UpdateStatus.checking) return;
    await m.checkForUpdate();
    if (!mounted) return;
    if (m.isUpdateAvailable && m.downloadLink != null) {
      await Get.dialog(UpdateAlertDialog(downloadLink: m.downloadLink!, isDirectApkDownload: m.usesApkDownload));
    } else { Get.snackbar('YuuZPime', m.status == UpdateStatus.failed ? 'Gagal mengecek versi terbaru.' : 'Sudah menggunakan versi terbaru.'); }
  }
  Widget _group(String title, List<Widget> children) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.fromLTRB(4, 22, 4, 10), child: Text(title, style: const TextStyle(color: tkMutedText, fontSize: 12, letterSpacing: 1.5, fontWeight: FontWeight.w800))),
    Container(decoration: BoxDecoration(color: tkSurface, borderRadius: BorderRadius.circular(22), border: Border.all(color: tkSurfaceBorder)), child: Column(children: children)),
  ]);
  @override
  Widget build(BuildContext context) {
    return TakoScaffoldWithBackButton(appBarTitle: 'Pengaturan', body: ListView(padding: const EdgeInsets.fromLTRB(16, 10, 16, 32), children: [
      Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: tkDarkBlue, borderRadius: BorderRadius.circular(24), border: Border.all(color: tkSurfaceBorder)), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [YuuzWordmark(), SizedBox(height: 12), Text('Versi 1.9.2', style: TextStyle(color: tkMutedText))])),
      _group('TAMPILAN', [SwitchListTile(secondary: const Icon(Icons.animation), title: const Text('Intro aplikasi'), subtitle: const Text('Animasi logo saat aplikasi dibuka'), value: _intro, onChanged: _loaded ? (v) => _save('yuuz_intro', v) : null)]),
      _group('PEMUTAR', [GetBuilder<WebViewManager>(builder: (m) => SwitchListTile(secondary: const Icon(Icons.play_circle_outline), value: m.isWebView, onChanged: m.changeWebViewType, title: const Text('Use browser player'), subtitle: const Text('Gunakan jika pemutar utama bermasalah')))]),
      _group('PEMBARUAN', [
        SwitchListTile(secondary: const Icon(Icons.system_update_alt), title: const Text('Cek update otomatis'), subtitle: const Text('Periksa versi baru saat aplikasi dibuka'), value: _auto, onChanged: _loaded ? (v) => _save('yuuz_auto_update', v) : null),
        const Divider(height: 1),
        GetBuilder<UpdateManager>(builder: (m) => ListTile(leading: const Icon(Icons.refresh), title: const Text('Cek update sekarang'), subtitle: Text(m.status == UpdateStatus.checking ? 'Memeriksa...' : 'GitHub Releases resmi'), onTap: m.status == UpdateStatus.checking ? null : _check)),
      ]),
      _group('INFORMASI', [ListTile(leading: const Icon(Icons.info_outline), title: const Text('Tentang YuuZPime'), trailing: const Icon(Icons.chevron_right), onTap: () => Get.toNamed(Routes.aboutAppScreen))]),
    ]));
  }
}
