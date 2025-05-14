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

  // TODO: Implement a function to update user settings
  const handleDarkModeChange = () => {
    if (user) {
      // This would ideally call an update function:
      // await window.db.user.updateUser({ ...user, dark: user.dark ? 0 : 1 });
      // For now, just toggle the state locally or log
      console.log("Dark mode toggled. Current user state:", user);
      // setUser({ ...user, dark: user.dark ? 0 : 1 }); // Example local toggle
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
