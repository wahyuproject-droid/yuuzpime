import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import '../services/request_service.dart';
import '../utils/constants.dart';

enum UpdateStatus { unknown, checking, current, available, failed }

class UpdateManager extends GetxController {
  UpdateManager({RequestService? requestService, TargetPlatform? platform})
      : _requestService = requestService, _platform = platform ?? defaultTargetPlatform;
  final RequestService? _requestService;
  final TargetPlatform _platform;
  UpdateStatus _status = UpdateStatus.unknown;
  String? _downloadLink;
  String? _newVersion;
  bool _usesApkDownload = false;
  UpdateStatus get status => _status;
  String? get downloadLink => _downloadLink;
  String? get newVersion => _newVersion;
  bool get usesApkDownload => _usesApkDownload;
  bool get isUpdateAvailable => _status == UpdateStatus.available;

  static List<int>? _parts(Object? tag) {
    if (tag is! String) return null;
    final m = RegExp(r'^yuuzpime-tako-v(\d+)\.(\d+)\.(\d+)$').firstMatch(tag);
    return m == null ? null : [for (var i = 1; i <= 3; i++) int.parse(m.group(i)!)];
  }
  static int _compare(List<int> a, List<int> b) {
    for (var i = 0; i < 3; i++) { final c = a[i].compareTo(b[i]); if (c != 0) return c; }
    return 0;
  }
  Future<void> checkForUpdate() async {
    if (_status == UpdateStatus.checking) return;
    _status = UpdateStatus.checking;
    _downloadLink = null; _newVersion = null; _usesApkDownload = false;
    update();
    try {
      if (_platform != TargetPlatform.android) { _status = UpdateStatus.current; return; }
      final response = await (_requestService ?? Get.find<RequestService>()).requestGitHubUpdate(latestRelease);
      final decoded = jsonDecode(response.body);
      if (decoded is! List) throw const FormatException('Expected release list');
      var newest = _parts(version)!;
      for (final item in decoded) {
        if (item is! Map || item['draft'] == true) continue;
        final tag = item['tag_name'];
        final numbers = _parts(tag);
        if (numbers == null || _compare(numbers, newest) <= 0) continue;
        final assets = item['assets'];
        if (assets is! List) continue;
        // Only use release assets from this project's official GitHub repository.
        String? candidate;
        for (final asset in assets) {
          if (asset is! Map) continue;
          final name = asset['name'];
          if (name != 'YuuZPime.apk' && name != 'YuuZPime-debug.apk') continue;
          final url = asset['browser_download_url'];
          final expected = 'https://github.com/wahyuproject-droid/yuuzpime/releases/download/$tag/$name';
          if (url == expected) {
            candidate = expected;
            if (name == 'YuuZPime.apk') break;
          }
        }
        if (candidate == null) continue;
        newest = numbers; _downloadLink = candidate; _newVersion = tag as String; _usesApkDownload = true;
      }
      _status = _downloadLink == null ? UpdateStatus.current : UpdateStatus.available;
    } catch (_) { _status = UpdateStatus.failed; _downloadLink = null; _newVersion = null; _usesApkDownload = false; }
    finally { update(); }
  }
}
