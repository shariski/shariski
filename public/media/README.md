# Station media

Each origin-line stop's detail popup shows a short clip in a **square (1:1) cover-crop**
frame. Files here are **dummy placeholders** (ffmpeg `testsrc2` patterns) — replace each
`*.mp4` with your real clip and regenerate its poster.

| file            | stop      | your real clip            |
|-----------------|-----------|---------------------------|
| `departure.mp4` | departure | a teardown / build clip   |
| `water.mp4`     | water     | your swimming video       |
| `keys.mp4`      | keys      | your typing video         |
| `kerf.mp4`      | kerf      | a kerf screen-recording   |

`*.jpg` is the poster (first frame) — shown before play, and to `prefers-reduced-motion`
users instead of autoplay.

## Wiring (in `../index.html`)

Each entry in the `STATIONS` array points at its media:

```js
media:'media/water.mp4', poster:'media/water.jpg'
```

Drop a stop's `media`/`poster` to make its slot collapse gracefully (no broken box).

## Encoding guidance

- **Format:** MP4, H.264 video + (no audio needed — clips autoplay **muted, looped**).
- **Crop:** the frame is square and cover-crops. Portrait clips lose a little top/bottom;
  landscape (e.g. the kerf screen-rec) loses left/right — keep the important action centered.
- **Keep them small** (aim for a couple MB): short loop, reasonable bitrate.

Example re-encode of a real clip + poster:

```sh
ffmpeg -i my-swim.mov -an -vf "scale=-2:960" -movflags +faststart -pix_fmt yuv420p water.mp4
ffmpeg -i water.mp4 -frames:v 1 -q:v 3 water.jpg
```
