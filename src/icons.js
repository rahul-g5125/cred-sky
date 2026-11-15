const CLOUD_PATH =
  'M-64 40C-82 40-97 25-97 7C-97-10-84-25-67-27C-62-51-43-69-19-69C8-69 31-49 34-24C52-21 66-7 66 10C66 27 52 40 34 40Z';

function cloud(x, y, scale = 1, className = 'cloud-main') {
  return `<path class="${className}" d="${CLOUD_PATH}" transform="translate(${x} ${y}) scale(${scale})"/>`;
}

function sun({ x = 110, y = 110, scale = 1, orbit = false } = {}) {
  return `
    <g class="sun" transform="translate(${x} ${y}) scale(${scale})">
      ${orbit ? '<circle class="sun-orbit" r="96" fill="none"/>' : ''}
      <g class="sun-rays">
        <path class="sun-ray" d="M0 -84V-66" />
        <path class="sun-ray" d="M0 84V66" />
        <path class="sun-ray" d="M-84 0H-66" />
        <path class="sun-ray" d="M84 0H66" />
        <path class="sun-ray" d="M-59 -59L-47 -47" />
        <path class="sun-ray" d="M59 59L47 47" />
        <path class="sun-ray" d="M59 -59L47 -47" />
        <path class="sun-ray" d="M-59 59L-47 47" />
      </g>
      <circle class="sun-halo" r="52" />
      <circle class="sun-core" r="36" />
      <circle class="sun-inner" r="25" />
    </g>
  `;
}

function moon({ x = 0, y = 0, scale = 1 } = {}) {
  return `<path class="moon" d="M137 36a72 72 0 1 0 44 122 60 60 0 0 1-44-122Z" transform="translate(${x} ${y}) scale(${scale})"/>`;
}

function stars() {
  return `
    <g class="stars">
      <path class="star" d="M62 58l2.2 6.7 6.8 2.3-6.8 2.4-2.2 6.6-2.2-6.6-6.8-2.4 6.8-2.3Z" />
      <path class="star star--small" d="M160 46l1.6 4.9 4.9 1.7-4.9 1.7-1.6 4.8-1.6-4.8-4.9-1.7 4.9-1.7Z" />
      <path class="star star--small" d="M158 132l1.4 4.2 4.3 1.5-4.3 1.5-1.4 4.2-1.4-4.2-4.3-1.5 4.3-1.5Z" />
      <circle class="star-dot" cx="46" cy="126" r="2" />
      <circle class="star-dot" cx="82" cy="160" r="1.4" />
    </g>
  `;
}

function rainDrops() {
  return `
    <g class="rain-drops">
      <path class="rain-drop" d="M80 188v12" />
      <path class="rain-drop rain-drop--2" d="M110 196v14" />
      <path class="rain-drop rain-drop--3" d="M140 186v12" />
    </g>
  `;
}

function snowFlakes() {
  return `
    <g class="snow-flakes">
      <g class="snow-flake" transform="translate(78 190)">
        <path d="M0 -9V9M-8 -4.5L8 4.5M-8 4.5L8 -4.5" />
      </g>
      <g class="snow-flake snow-flake--2" transform="translate(111 201)">
        <path d="M0 -8V8M-7 -4L7 4M-7 4L7 -4" />
      </g>
      <g class="snow-flake snow-flake--3" transform="translate(144 188)">
        <path d="M0 -9V9M-8 -4.5L8 4.5M-8 4.5L8 -4.5" />
      </g>
    </g>
  `;
}

function svg(content, kind) {
  return `<svg class="weather-svg weather-svg--${kind}" viewBox="0 0 220 220" aria-hidden="true" focusable="false">${content}</svg>`;
}

export function weatherIcon(kind) {
  switch (kind) {
    case 'clear':
      return svg(`${sun({ orbit: true })}`, kind);

    case 'clear-night':
      return svg(`${stars()}${moon()}`, kind);

    case 'partly':
      return svg(`${sun({ x: 78, y: 80, scale: 0.8 })}${cloud(126, 144, 0.9)}`, kind);

    case 'partly-night':
      return svg(`${stars()}${moon({ scale: 0.62, x: 2, y: 6 })}${cloud(128, 150, 0.82)}`, kind);

    case 'rain':
      return svg(`${cloud(110, 130, 0.94)}${rainDrops()}`, kind);

    case 'storm':
      return svg(
        `${cloud(110, 126, 0.94)}
         <path class="bolt" d="M117 150l-19 38h17l-10 30 31-44h-18l14-24Z" />
         ${rainDrops()}`,
        kind,
      );

    case 'snow':
      return svg(`${cloud(110, 124, 0.9)}${snowFlakes()}`, kind);

    case 'mist':
      return svg(
        `<circle class="mist-sun" cx="148" cy="72" r="27" fill="none" />
         <path class="fog-line" d="M38 118h84" />
         <path class="fog-line fog-line--2" d="M70 144h112" />
         <path class="fog-line fog-line--3" d="M28 170h96" />
         <path class="fog-line fog-line--4" d="M66 196h90" />`,
        kind,
      );

    case 'cloudy':
    default:
      return svg(`${cloud(88, 106, 0.66, 'cloud-back')}${cloud(120, 150, 0.94)}`, 'cloudy');
  }
}

export function verdictIcon(key) {
  const open = '<svg class="verdict-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">';
  const close = '</svg>';
  const line = (paths) =>
    `${open}<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</g>${close}`;

  switch (key) {
    case 'freeze':
      return line(
        '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.2 4.2 12 7l2.8-2.8M9.2 19.8 12 17l2.8 2.8"/>',
      );

    case 'storm':
      return line('<path d="M13 2 5.5 13.5H11L9.5 22 18 10h-5.5L13 2Z"/>');

    case 'rain':
      return line(
        '<path d="M3.5 12a8.5 8.5 0 0 1 17 0H3.5Z"/><path d="M12 12v7a2.5 2.5 0 0 0 5 0"/><path d="M7.5 5.5c1-2 2.5-3 4.5-3"/>',
      );

    case 'heat':
    case 'perfect':
      return line(
        '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
      );

    case 'wind':
      return line(
        '<path d="M3 8h10.5a2.5 2.5 0 1 0-2.3-3.5M3 12h15a2.5 2.5 0 1 1-2.3 3.5M3 16h7"/>',
      );

    case 'cold':
      return line(
        '<path d="M12 3.5c-3.3 0-5.5 2.3-5.5 5.5H9l3 5-3 5h-2.5c0 3.2 2.2 5.5 5.5 5.5s5.5-2.3 5.5-5.5H15l-3-5 3-5h2.5c0-3.2-2.2-5.5-5.5-5.5Z"/>',
      );

    case 'warm':
      return line(
        '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z"/><path d="M12 8v8"/>',
      );

    default:
      return line('<path d="M12 3l2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/>');
  }
}
