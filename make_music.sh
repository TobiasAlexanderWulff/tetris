#!/usr/bin/env bash
set -euo pipefail

SR=44100
DUR_BAR=1.875
DUR_8TH=0.234375
OUT_DIR="packages/web/src/audio/music"
TMP=".tmp_music_build"

mkdir -p "$OUT_DIR" "$TMP/lead" "$TMP/pad" "$TMP/bass" "$TMP/menu_pad" "$TMP/menu_pluck"

# Helpers
mk_square_note(){ ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=(gt(sin(2*PI*$1*t)\,0)*2-1):s=$SR:d=$2" -ar $SR -ac 1 "$3"; }
mk_sine_note(){   ffmpeg -loglevel error -y -f lavfi -i "sine=f=$1:d=$2" -ar $SR -ac 1 "$3"; }
mk_tri_note(){    ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=(2/PI)*asin(sin(2*PI*$1*t)):s=$SR:d=$2" -ar $SR -ac 1 "$3"; }
concat_list(){    ffmpeg -loglevel error -y -f concat -safe 0 -i "$1" -c copy "$2"; }
mix_2(){          ffmpeg -loglevel error -y -i "$1" -i "$2" -filter_complex "[0:a][1:a]amix=inputs=2:normalize=0" -ar $SR -ac 1 "$3"; }
mix_3(){          ffmpeg -loglevel error -y -i "$1" -i "$2" -i "$3" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:normalize=0" -ar $SR -ac 1 "$4"; }

# Chords
CHORDS_ROOT=(261.63 207.65 174.61 196.00)
CHORDS_THIRD=(311.13 261.63 207.65 246.94)
CHORDS_FIFTH=(392.00 311.13 261.63 293.66)

# ===== THEME MAIN =====
: > "$TMP/lead_list.txt"; : > "$TMP/pad_list.txt"; : > "$TMP/bass_list.txt"

for bar in $(seq 0 31); do
  idx=$((bar % 4))
  r="${CHORDS_ROOT[$idx]}"; t="${CHORDS_THIRD[$idx]}"; f="${CHORDS_FIFTH[$idx]}"

  rL=$(python3 - <<EOF
print($r*2)
EOF
)
  tL=$(python3 - <<EOF
print($t*2)
EOF
)
  fL=$(python3 - <<EOF
print($f*2)
EOF
)

  # Lead (8 Achtel: r,t,f,r,t,f,r,t)
  LEAD_BAR_DIR="$TMP/lead/bar_${bar}"; mkdir -p "$LEAD_BAR_DIR"
  freqs=("$rL" "$tL" "$fL" "$rL" "$tL" "$fL" "$rL" "$tL")
  for i in $(seq 0 7); do
    mk_square_note "${freqs[$i]}" "$DUR_8TH" "$LEAD_BAR_DIR/n${i}.wav"
  done
  LIST_LEAD_BAR="$LEAD_BAR_DIR/list.txt"; : > "$LIST_LEAD_BAR"
  for i in $(seq 0 7); do echo "file '$PWD/$LEAD_BAR_DIR/n${i}.wav'" >> "$LIST_LEAD_BAR"; done
  concat_list "$LIST_LEAD_BAR" "$TMP/lead/bar_${bar}.wav"
  echo "file '$PWD/$TMP/lead/bar_${bar}.wav'" >> "$TMP/lead_list.txt"

  # Pad (Triangle-Mix)
  mk_tri_note "$r" "$DUR_BAR" "$TMP/pad/r_${bar}.wav"
  mk_tri_note "$t" "$DUR_BAR" "$TMP/pad/t_${bar}.wav"
  mk_tri_note "$f" "$DUR_BAR" "$TMP/pad/f_${bar}.wav"
  mix_3 "$TMP/pad/r_${bar}.wav" "$TMP/pad/t_${bar}.wav" "$TMP/pad/f_${bar}.wav" "$TMP/pad/pad_mix_${bar}.wav"
  ffmpeg -loglevel error -y -i "$TMP/pad/pad_mix_${bar}.wav" -filter_complex "volume=0.35" "$TMP/pad/bar_${bar}.wav"
  echo "file '$PWD/$TMP/pad/bar_${bar}.wav'" >> "$TMP/pad_list.txt"

  # Bass (Sine, eine Oktave tiefer)
  rB=$(python3 - <<EOF
print($r/2)
EOF
)
  mk_sine_note "$rB" "$DUR_BAR" "$TMP/bass/bar_${bar}.wav"
  echo "file '$PWD/$TMP/bass/bar_${bar}.wav'" >> "$TMP/bass_list.txt"
done

concat_list "$TMP/lead_list.txt" "$TMP/lead_full.wav"
concat_list "$TMP/pad_list.txt"  "$TMP/pad_full.wav"
concat_list "$TMP/bass_list.txt" "$TMP/bass_full.wav"

ffmpeg -loglevel error -y -i "$TMP/lead_full.wav" -i "$TMP/pad_full.wav" -i "$TMP/bass_full.wav" \
  -filter_complex "[0:a][1:a][2:a]amix=inputs=3:normalize=0,aformat=sample_fmts=fltp:sample_rates=$SR:channel_layouts=mono,pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-1:LRA=7:dual_mono=true,atrim=0:60,asetpts=N/SR/TB" \
  -c:a libvorbis "$OUT_DIR/theme_main.ogg"

# ===== MENU AMBIENT =====
: > "$TMP/menu_pad_list.txt"; : > "$TMP/menu_pluck_list.txt"

for bar in $(seq 0 31); do
  idx=$((bar % 4))
  r="${CHORDS_ROOT[$idx]}"; t="${CHORDS_THIRD[$idx]}"; f="${CHORDS_FIFTH[$idx]}"

  # Pad (Sine-Stack)
  mk_sine_note "$r" "$DUR_BAR" "$TMP/menu_pad/r_${bar}.wav"
  mk_sine_note "$t" "$DUR_BAR" "$TMP/menu_pad/t_${bar}.wav"
  mk_sine_note "$f" "$DUR_BAR" "$TMP/menu_pad/f_${bar}.wav"
  mix_3 "$TMP/menu_pad/r_${bar}.wav" "$TMP/menu_pad/t_${bar}.wav" "$TMP/menu_pad/f_${bar}.wav" "$TMP/menu_pad/pad_mix_${bar}.wav"
  ffmpeg -loglevel error -y -i "$TMP/menu_pad/pad_mix_${bar}.wav" -filter_complex "volume=0.45" "$TMP/menu_pad/bar_${bar}.wav"
  echo "file '$PWD/$TMP/menu_pad/bar_${bar}.wav'" >> "$TMP/menu_pad_list.txt"

  # Pluck (Square 250ms auf Mittenton +12)
  mt=$(python3 - <<EOF
print($t*2)
EOF
)
  # Milder: Triangle, kürzer, Hüllkurve + Lowpass + leiser
  mk_tri_note "$mt" "0.22" "$TMP/menu_pluck/p_${bar}.wav"
  ffmpeg -loglevel error -y -i "$TMP/menu_pluck/p_${bar}.wav" \
    -filter_complex "afade=in:st=0:d=0.01,afade=out:st=0.18:d=0.04,lowpass=f=1800,volume=0.20" \
    "$TMP/menu_pluck/p_${bar}_proc.wav"
  mv "$TMP/menu_pluck/p_${bar}_proc.wav" "$TMP/menu_pluck/p_${bar}.wav"

  rest=$(python3 - <<EOF
print($DUR_BAR-0.22)
EOF
)
  ffmpeg -loglevel error -y -f lavfi -i "anullsrc=channel_layout=mono:sample_rate=$SR" -t "$rest" "$TMP/menu_pluck/sil_${bar}.wav"
  LIST_PLUCK_BAR="$TMP/menu_pluck/list_${bar}.txt"; : > "$LIST_PLUCK_BAR"
  echo "file '$PWD/$TMP/menu_pluck/p_${bar}.wav'"  >> "$LIST_PLUCK_BAR"
  echo "file '$PWD/$TMP/menu_pluck/sil_${bar}.wav'" >> "$LIST_PLUCK_BAR"
  concat_list "$LIST_PLUCK_BAR" "$TMP/menu_pluck/bar_${bar}.wav"
  echo "file '$PWD/$TMP/menu_pluck/bar_${bar}.wav'" >> "$TMP/menu_pluck_list.txt"
done

concat_list "$TMP/menu_pad_list.txt"   "$TMP/menu_pad_full.wav"
concat_list "$TMP/menu_pluck_list.txt" "$TMP/menu_pluck_full.wav"

ffmpeg -loglevel error -y -i "$TMP/menu_pad_full.wav" -i "$TMP/menu_pluck_full.wav" \
  -filter_complex "[0:a][1:a]amix=inputs=2:normalize=0,aformat=sample_fmts=fltp:sample_rates=$SR:channel_layouts=mono,pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-1:LRA=7:dual_mono=true,atrim=0:60,asetpts=N/SR/TB" \
  -c:a libvorbis "$OUT_DIR/menu_ambient.ogg"

echo "Fertig: $OUT_DIR/theme_main.ogg  und  $OUT_DIR/menu_ambient.ogg"
