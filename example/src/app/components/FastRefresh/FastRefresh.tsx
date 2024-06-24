import React from "react";
import styles from "./FastRefresh.module.css";

// Create a component which showcases that Fast Refresh works (use timer to increment a variable every second)
export function FastRefesh() {
	const [count, setCount] = React.useState(0);

	React.useEffect(() => {
		const interval = setInterval(() => {
			setCount((count) => count + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return <div className={styles.root}>Count: {count}</div>;
}
