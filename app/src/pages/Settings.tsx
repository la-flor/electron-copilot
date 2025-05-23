import { useEffect, useState } from "react";
import { User } from "../shared/interfaces/database.interface";

const TEST_USER_ID = 1;

export const Settings = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const fetchedUser: User = await window.db.user.fetchUser(TEST_USER_ID);
      setUser(fetchedUser);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      document.documentElement.dataset.bsTheme = user.dark ? "dark" : "light";
    }
    // Optional: Cleanup function to reset theme if user logs out or component unmounts
    // return () => {
    //   document.documentElement.removeAttribute('data-bs-theme'); // Or set to a default theme
    // };
  }, [user]); // This effect runs when the `user` state changes

  const handleDarkModeChange = async () => {
    if (user) {
      const newDarkValue = user.dark ? 0 : 1;
      try {
        await window.db.user.updateUser({ id: user.id, dark: newDarkValue });
        setUser({ ...user, dark: newDarkValue });
      } catch (error) {
        console.error("Failed to update dark mode setting:", error);
        // Optionally, revert the checkbox state or show an error to the user
      }
    }
  };

  if (!user) {
    return <div>Loading user settings...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>User Settings</h2>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Profile Information</h5>
          <p className="card-text">
            <strong>First Name:</strong> {user.first_name}
          </p>
          <p className="card-text">
            <strong>Last Name:</strong> {user.last_name}
          </p>
          <p className="card-text">
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="card-title">Preferences</h5>
          <div className="form-check">
            <input
              type="checkbox"
              id="dark-mode"
              name="dark-mode"
              className="form-check-input"
              checked={!!user.dark}
              onChange={handleDarkModeChange}
            />
            <label htmlFor="dark-mode" className="form-check-label">
              Dark Mode
            </label>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              className="form-check-input"
            />
            <label htmlFor="notifications" className="form-check-label">
              Notifications
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
