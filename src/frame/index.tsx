import * as React from "react";
import styles from "./style.module.css";

export function Frame() {
  const [contactText, setContactText] = React.useState("CONTACT");
  const [isFading, setIsFading] = React.useState(false);
  const [creditText, setCreditText] = React.useState("by aadhavan");
  const [isCreditFading, setIsCreditFading] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setContactText((prev) => (prev === "CONTACT" ? "SPONSOR" : "CONTACT"));
        setIsFading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCreditFading(true);
      setTimeout(() => {
        setCreditText((prev) => (prev === "by aadhavan" ? "by aadhav3n" : "by aadhavan"));
        setIsCreditFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreditHover = () => {
    setIsCreditFading(true);
    setTimeout(() => {
      setCreditText((prev) => (prev === "by aadhavan" ? "by aadhav3n" : "by aadhavan"));
      setIsCreditFading(false);
    }, 300);
  };

  return (
    <header className={`frame ${styles.frame}`}>
      <div className={styles.frame__titleContainer}>
        <h1 className={styles.frame__title}>MEGA MAALAI</h1>
        <p className={styles.frame__subtitle}>32 years in the making</p>
      </div>
      <nav className={styles.frame__nav}>
        <a className={styles.frame__home} href="https://home.megamaalai.org">
          HOME
        </a>
        <a className={styles.frame__timeline} href="https://timeline.megamaalai.org">
          TIMELINE
        </a>
        <a className={styles.frame__tickets} href="https://tickets.megamaalai.org">
          TICKETS
        </a>
        <a 
          className={`${styles.frame__contact} ${isFading ? styles.fading : ""}`} 
          href="https://www.instagram.com/megamaalai/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {contactText}
        </a>
      </nav>
      <div className={styles.frame__bottom}>
        <nav className={styles.frame__tags}>
          <a href="https://www.instagram.com/explore/tags/megamaalai/" target="_blank" rel="noopener noreferrer">
            #megamaalai
          </a>
          <a href="https://www.instagram.com/explore/tags/mm26/" target="_blank" rel="noopener noreferrer">
            #mm26
          </a>
          <a href="https://www.instagram.com/explore/tags/imperialtsoc/" target="_blank" rel="noopener noreferrer">
            #imperialtsoc
          </a>
        </nav>
        <div 
          className={styles.frame__credits}
          onMouseEnter={handleCreditHover}
        >
          <span className={isCreditFading ? styles.fading : ""}>{creditText}</span>
        </div>
      </div>
    </header>
  );
}
