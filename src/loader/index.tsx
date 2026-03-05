import * as React from "react";
import styles from "./style.module.css";

const COMMENTS = [
  "Imperial Tamil Society was founded in 1996 by etc",
  "We have had over 1600 dancers participate in Mega Maalai and 12,000 attendees",
  "Follow our Instagram @imperialtsoc for updates",
];

export function PageLoader({ progress }: { progress: number }) {
  const [show, setShow] = React.useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const visualRef = React.useRef(0);
  const [visualProgress, setVisualProgress] = React.useState(0);
  const [currentCommentIndex, setCurrentCommentIndex] = React.useState(0);
  const [isCommentFading, setIsCommentFading] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    let raf: number;

    const animate = () => {
      const diff = progress - visualRef.current;

      if (diff > 0.1) {
        // Lerp toward target, faster when further behind
        visualRef.current += diff * 0.08;
        setVisualProgress(visualRef.current);
        raf = requestAnimationFrame(animate);
      } else {
        // Snap when close enough
        visualRef.current = progress;
        setVisualProgress(progress);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  React.useEffect(() => {
    if (minTimeElapsed && progress === 100 && visualProgress >= 99.5) {
      const t = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(t);
    }
  }, [minTimeElapsed, progress, visualProgress]);

  // Cycle through comments every 3 seconds with fade transition
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCommentFading(true);
      setTimeout(() => {
        setCurrentCommentIndex((prev) => (prev + 1) % COMMENTS.length);
        setIsCommentFading(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!show) {
    return null;
  }

  const isHidden = minTimeElapsed && progress === 100 && visualProgress >= 99.5;

  return (
    <div className={`${styles.overlay} ${isHidden ? styles.hidden : styles.visible}`}>
      <div className={styles.loaderContent}>
        <div className={styles.progressInfo}>
          <span className={styles.progressNumber}>{Math.round(visualProgress)}%</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarFill} style={{ transform: `scaleX(${visualProgress / 100})` }} />
        </div>
        <div className={styles.commentContainer}>
          <p className={`${styles.comment} ${isCommentFading ? styles.fading : ""}`}>
            {COMMENTS[currentCommentIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
