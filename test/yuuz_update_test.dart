import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:tako_play/helpers/update_manager.dart';
import 'package:tako_play/services/request_service.dart';

void main() {
  test('chooses only the highest newer official Android APK', () async {
    Map<String, dynamic> release(String tag, {String? url}) => {
      'tag_name': tag, 'draft': false, 'assets': [
        {'name': 'YuuZPime.apk', 'browser_download_url': url ?? 'https://github.com/wahyuproject-droid/yuuzpime/releases/download/$tag/YuuZPime.apk'}
      ]
    };
    final svc = RequestService(client: MockClient((_) async => http.Response(jsonEncode([
      release('native-v99.0.0'),
      release('yuuzpime-tako-v1.9.1'),
      release('yuuzpime-tako-v1.10.0'),
      release('yuuzpime-tako-v2.0.0'),
      release('yuuzpime-tako-v99.0.0', url: 'https://example.com/app.apk'),
    ]), 200)));
    final m = UpdateManager(requestService: svc, platform: TargetPlatform.android);
    await m.checkForUpdate();
    expect(m.status, UpdateStatus.available);
    expect(m.newVersion, 'yuuzpime-tako-v2.0.0');
    svc.close();
  });
  test('network failure is not presented as a current version', () async {
    final svc = RequestService(client: MockClient((_) async => http.Response('Unavailable', 503)));
    final m = UpdateManager(requestService: svc, platform: TargetPlatform.android);
    await m.checkForUpdate();
    expect(m.status, UpdateStatus.failed);
    expect(m.downloadLink, isNull);
    svc.close();
  });
}
