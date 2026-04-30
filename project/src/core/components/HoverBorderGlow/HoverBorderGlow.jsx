import './HoverBorderGlow.css';

/**
 * HoverBorderGlow — a bright "comet" of color that orbits the border
 * continuously. Used on the desktop Create button.
 *
 * Implementation: a conic-gradient anchored to a CSS-animated angle
 * (registered via @property so it can be smoothly tweened), masked to a
 * thin border ring via `mask-composite: exclude`, plus a blurred sibling
 * for the outer bloom. No JS animation loop, no cursor dependency.
 */
const HoverBorderGlow = ({
  children,
  className = '',
  borderRadius = 18,
  borderWidth = 2,
  bloomBlur = 18,
  bloomInset = 4,
  duration = 3000,
  spread = 60,
  colors = ['#ffffff', '#a5b4fc', '#7c3aed'],
  style: userStyle = {},
}) => {
  const [c1, c2, c3] = colors;

  return (
    <div
      className={`hbg-card ${className}`}
      style={{
        '--hbg-radius': `${borderRadius}px`,
        '--hbg-border-width': `${borderWidth}px`,
        '--hbg-bloom-blur': `${bloomBlur}px`,
        '--hbg-bloom-inset': `${bloomInset}px`,
        '--hbg-duration': `${duration}ms`,
        '--hbg-spread': `${spread}deg`,
        '--hbg-color-1': c1 || '#ffffff',
        '--hbg-color-2': c2 || '#a5b4fc',
        '--hbg-color-3': c3 || '#7c3aed',
        ...userStyle,
      }}
    >
      <span className="hbg-bloom" aria-hidden="true" />
      <div className="hbg-content">{children}</div>
      <span className="hbg-ring" aria-hidden="true" />
    </div>
  );
};

export default HoverBorderGlow;
