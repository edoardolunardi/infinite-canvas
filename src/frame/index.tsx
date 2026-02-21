import styles from "./style.module.css";

export function Frame() {
  return (
    <header className={`frame ${styles.frame}`}>
      <h1 className={styles.frame__title}>Immersive Gallery</h1>
      <a className={styles.frame__back} href="https://nyc.aitinkerers.org/">
        AI Tinkerers NYC
      </a>
      <a className={styles.frame__archive} href="">
        Feb 21, 2026
      </a>
      <a className={styles.frame__github} href="https://nyc.aitinkerers.org/p/interfaces-hackathon-with-claude">
        Claude Interface Hackathon
      </a>

      <nav className={styles.frame__tags}>
        <span>By</span>
        <span>Ethel Zhang</span>
        <span>Enrique Munguia</span>
        <span>Jean-Ezra Yeung</span>
        <span>Jing Huang</span>
      </nav>
    </header>
  );
}
