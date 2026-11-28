import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class YuuzMark extends StatelessWidget {
  const YuuzMark({super.key, this.size = 40, this.tile = true});
  final double size;
  final bool tile;
  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: size,
    child: DecoratedBox(
      decoration: BoxDecoration(color: tile ? Colors.white : Colors.transparent, borderRadius: BorderRadius.circular(size * .23)),
      child: CustomPaint(painter: _MarkPainter(tile ? const Color(0xFF111111) : Colors.white)),
    ),
  );
}
class _MarkPainter extends CustomPainter {
  const _MarkPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 100, size.height / 100);
    final p = Paint()..color = color..style = PaintingStyle.fill;
    canvas.drawPath(Path()..moveTo(19,24)..lineTo(36,24)..lineTo(50,45)..lineTo(64,24)..lineTo(81,24)..lineTo(57,60)..lineTo(57,78)..lineTo(43,78)..lineTo(43,60)..close(),p);
    canvas.restore();
  }
  @override
  bool shouldRepaint(_MarkPainter oldDelegate) => oldDelegate.color != color;
}
class YuuzWordmark extends StatelessWidget {
  const YuuzWordmark({super.key});
  @override
  Widget build(BuildContext context) => Row(children: [
    const YuuzMark(size: 36), const SizedBox(width: 9),
    Flexible(child: Text('YuuZPime', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1.2, color: Colors.white))),
  ]);
}
class YuuzIntro extends StatefulWidget {
  const YuuzIntro({super.key, required this.child});
  final Widget child;
  @override
  State<YuuzIntro> createState() => _YuuzIntroState();
}
class _YuuzIntroState extends State<YuuzIntro> {
  bool _visible = true;
  bool _fade = false;
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }
  Future<void> _start() async {
    var enabled = true;
    try {
      enabled = (await SharedPreferences.getInstance()).getBool('yuuz_intro') ?? true;
    } catch (_) {}
    if (!mounted) return;
    if (!enabled || MediaQuery.disableAnimationsOf(context)) {
      setState(() => _visible = false);
      return;
    }
    _timer = Timer(const Duration(milliseconds: 1050), () {
      if (!mounted) return;
      setState(() => _fade = true);
      _timer = Timer(const Duration(milliseconds: 280), () {
        if (mounted) setState(() => _visible = false);
      });
    });
  }
  @override
  void dispose() { _timer?.cancel(); super.dispose(); }
  @override
  Widget build(BuildContext context) => Stack(fit: StackFit.expand, children: [
    widget.child,
    if (_visible)
      Positioned.fill(child: AnimatedOpacity(opacity: _fade ? 0 : 1, duration: const Duration(milliseconds: 280),
        child: Material(color: const Color(0xFF0B0B0B), child: Center(child: TweenAnimationBuilder<double>(
          tween: Tween(begin: .84, end: 1), duration: const Duration(milliseconds: 750), curve: Curves.easeOutCubic,
          builder: (context, value, child) => Transform.scale(scale: value, child: child),
          child: const Column(mainAxisSize: MainAxisSize.min, children: [
            YuuzMark(size: 88), SizedBox(height: 24), Text('YuuZPime', style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1.8)),
            SizedBox(height: 8), Text('YUUZ STUDIO', style: TextStyle(color: Colors.white54, fontSize: 11, letterSpacing: 4)),
          ]),
        ))),
      )),
  ]);
}
