import styles from '../css/Tooltip.module.css';

const Tooltip = ({ message, children }) => (
    <div className={styles.tooltip}>
      {children}
      <span className={styles.tooltiptext}>{message}</span>
    </div>
  );
  
  export default Tooltip;
  