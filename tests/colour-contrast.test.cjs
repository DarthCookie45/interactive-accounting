// Palette/state regression audit. This is not a full rendered-page WCAG certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const colour = value => {
  let hex = ({white:'#ffffff',black:'#000000'})[value] || value;
  hex = hex.slice(1);
  if (hex.length === 3) hex = [...hex].map(char => char + char).join('');
  return [0,2,4].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
};
const linear = rgb => rgb.map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
const luminance = rgb => rgb.reduce((sum, n, i) => sum + n * [.2126,.7152,.0722][i], 0);
const ratio = (a,b) => (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
// Machado, Oliveira & Fernandes (2009), full-severity linear-RGB matrices.
// Intermediate blends below are approximate screening, not a clinical model.
const matrices = {
  protanopia: [[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
  deuteranopia: [[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
  tritanopia: [[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.303900]],
  monochrome: [[.2126,.7152,.0722],[.2126,.7152,.0722],[.2126,.7152,.0722]]
};
const profiles = [['standard', rgb => rgb]];
for (const [name, matrix] of Object.entries(matrices)) {
  for (const severity of [.25,.5,.75,1]) profiles.push([name + ':' + severity, rgb => matrix.map((row,i) => Math.max(0,Math.min(1, rgb[i] * (1-severity) + severity * row.reduce((sum,n,j) => sum + n * rgb[j],0))))]);
}
const pairs = [
  ['Body','#1f2937','#fffaf0'], ['Card','#1f2937','#cceef0'],
  ['Purple button','#ffffff','#5b3cc4'], ['Result summary','#ffffff','#382463'],
  ['Correct feedback','#1f2937','#dff6e8'], ['Incorrect feedback','#1f2937','#ffe3e3'],
  ['Hint','#572a15','#ffcaa7'], ['Hint hover','#572a15','#ffd9bf'],
  ['Outline button on blue','#084fba','#cceef0'], ['Outline button on purple','#084fba','#eee8ff'],
  ['Profit','#146c43','#eee8ff'], ['Loss','#a12622','#eee8ff'],
  ['Glossary heading','#5b3cc4','#cceef0'], ['Achievement','#1f2937','#f4edff'],
  ['Next-day hover','#35235f','#e1d7ff'], ['Selected fallback dark','#ffffff','#1f2937'],
  ['Primary blue button','#ffffff','#0b5ed7'], ['Cycle active','#ffffff','#6b4ee8'],
  ['Cycle unvisited','#44506a','#e1e7f1'], ['Cycle visited','#44506a','#dff8f4'],
  ['Cycle hover','#44506a','#d2caf8'], ['Cycle core','#d7ddec','#1f2937'],
  ['Cycle output','#23705a','#dff6ef'], ['Body copy','#4b5563','#fffaf0'],
  ['Card copy','#4b5563','#ccefee'], ['Card category','#5b3cc4','#ccefee'],
  ['Footer links','#5b3cc4','#eee8ff'], ['Success alert','#0a3622','#d1e7dd'],
  ['Error alert','#58151c','#f8d7da'], ['Warning alert','#664d03','#fff3cd'],
  ['Information alert','#055160','#cff4fc'], ['Form boundary','#6c757d','#ffffff']
];
let minimum = Infinity, worst;
for (const [label, foreground, background] of pairs) {
  for (const [profile, transform] of profiles) {
    const contrast = ratio(luminance(transform(linear(colour(foreground)))), luminance(transform(linear(colour(background)))));
    if (contrast < minimum) { minimum = contrast; worst = label + ' / ' + profile; }
    assert(contrast >= (label === 'Form boundary' ? 3 : 4.5), label + ' / ' + profile + ': ' + contrast.toFixed(2));
  }
}
// Check literal foreground/background pairs together in the stylesheet.
let literalPairs = 0;
for (const [,selector,body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (selector.includes(':disabled')) continue;
  const fg = body.match(/(?<![-\w])color:\s*(#[\da-fA-F]{6}|white|black)\b/);
  const bg = body.match(/background(?:-color)?:\s*(#[\da-fA-F]{6}|white|black)\b/);
  if (!fg || !bg) continue;
  assert(ratio(luminance(linear(colour(fg[1]))), luminance(linear(colour(bg[1])))) >= 4.5, selector.trim());
  literalPairs++;
}
// Validate automatic tile text across a dense sample of user-selected RGB colours.
for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
  const light = luminance(linear([r/255,g/255,b/255]));
  assert(ratio(light, light > .179 ? 0 : 1) >= 4.5);
}
const blitz = fs.readFileSync(path.join(root, 'js/activities.js'), 'utf8');
assert(blitz.includes('Last answer: ') && blitz.includes('✓ Correct') && blitz.includes('✕ Incorrect'));
assert(css.includes('content: " ✓"'));
assert(css.includes('forced-colors: active'));
console.log('Passed: ' + pairs.length + ' core pairs × ' + profiles.length + ' colour-vision screening profiles, ' + literalPairs + ' literal CSS pairs, 4,096 custom colour samples and non-colour status cues.');
console.log('Lowest core screening contrast: ' + minimum.toFixed(2) + ':1 (' + worst + ').');
