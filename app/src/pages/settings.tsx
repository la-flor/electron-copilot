import { useEffect, useState } from "react";

const TEST_USER_ID = 1;

export const Settings = () => {
  const [user, setUser] = useState([]);

  useEffect(() => {
    const getUser = async () => {
      const user = await window.db.user.fetchUser(TEST_USER_ID);
      setUser(user);
    };

    getUser();
  }, []);

  return (
    <div className="d-flex">
      <div className="row">
        <div className="card">
          <div className="form-check">
            <input
              type="checkbox"
              id="dark-mode"
              name="dark-mode"
              className="form-check-input"
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
