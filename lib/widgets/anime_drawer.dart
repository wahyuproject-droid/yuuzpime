import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../utils/constants.dart';
import '../utils/routes.dart';
import 'yuuz_brand.dart';

class AnimeDrawer extends StatelessWidget {
  const AnimeDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: MediaQuery.of(context).size.width * .82,
      backgroundColor: tkDarkerBlue,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 18),
              child: Row(
                children: [
                  const Expanded(child: YuuzWordmark()),
                  IconButton(
                    onPressed: Get.back,
                    icon: const Icon(Icons.close_rounded, color: tkMutedText),
                  ),
                ],
              ),
            ),
            Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: tkSurface, borderRadius: BorderRadius.circular(24), border: Border.all(color: tkSurfaceBorder)),
              child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                YuuzMark(size: 58), SizedBox(height: 18),
                Text('Your anime space', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                SizedBox(height: 6), Text('Browse, save, and keep watching.', style: TextStyle(color: tkMutedText)),
              ]),
            ),
            const SizedBox(height: 16),
            _DrawerItem(
              icon: Icons.tune_rounded,
              label: 'Settings',
              onTap: () => Get.toNamed(Routes.settingsScreen),
            ),
            _DrawerItem(
              icon: Icons.info_outline_rounded,
              label: 'About YuuZPime',
              onTap: () => Get.toNamed(Routes.aboutAppScreen),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('YUUZPIME  •  $version',
                  style: TextStyle(
                      color: tkMutedText, fontSize: 10, letterSpacing: .8)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(15),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            child: Row(
              children: [
                Icon(icon, color: tkCoral, size: 21),
                const SizedBox(width: 15),
                Text(label,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700)),
                const Spacer(),
                const Icon(Icons.arrow_forward_ios_rounded,
                    size: 13, color: tkMutedText),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
