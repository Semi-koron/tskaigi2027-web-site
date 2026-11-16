import styles from "./index.module.css";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button onClick={onClick} className={styles["button"]}>
      {children}
    </button>
  );
};

export default Button;
