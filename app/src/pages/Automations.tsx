import { useState, useEffect } from "react";
import { NewEditAutomation } from "../components/NewEditAutomation";
import { Automation } from "../shared/interfaces/database.interface";

export const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editAutomationId, setEditAutomationId] = useState<
    number | "new" | null
  >(null);

  const fetchAutomationsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await window.db.automation.fetchAutomations();
      setAutomations(data);
    } catch (err) {
      console.error("Failed to fetch automations:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationsData();
  }, []); // Initial fetch

  useEffect(() => {
    // Refetch when the modal is closed (editAutomationId becomes null after an add/edit)
    if (editAutomationId === null) {
      fetchAutomationsData();
    }
  }, [editAutomationId]);

  const handleDeleteAutomation = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this automation?")) {
      try {
        const result = await window.db.automation.deleteAutomation(id);
        if (result.success) {
          console.log("Automation deleted:", id);
          fetchAutomationsData(); // Refresh the list
        } else {
          console.error("Failed to delete automation:", result.message);
          // Optionally, show an error message to the user
          setError(result.message || "Failed to delete automation.");
        }
      } catch (err) {
        console.error("Error deleting automation:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred while deleting."
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container py-3">
        <p>Loading automations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-3">
        <p className="text-danger">Error loading automations: {error}</p>
        <button className="btn btn-primary" onClick={fetchAutomationsData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column gap-3 py-3">
      <div className="d-flex justify-content-end">
        <button
          className="btn btn-primary"
          onClick={() => setEditAutomationId("new")}
        >
          New Automation
        </button>
      </div>
      {editAutomationId !== null && (
        <NewEditAutomation
          id={typeof editAutomationId === "number" ? editAutomationId : null}
          onClose={() => setEditAutomationId(null)}
        />
      )}
      {automations.length === 0 && !isLoading && (
        <div className="alert alert-info" role="alert">
          No automations found. Click "New Automation" to add one.
        </div>
      )}
      {automations.map((automation) => (
        <div className="card" key={automation.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title">{automation.name}</h5>
              <strong
                className={
                  automation.status === "Active"
                    ? "text-primary"
                    : "text-warning"
                }
              >
                {automation.status}
              </strong>
            </div>
            <p className="card-text border border-1 p-2 rounded">
              {automation.description}
            </p>
            {automation.cronSchedule && automation.cronDescription && (
              <>
                <p className="card-text">
                  <strong>Schedule:</strong> {automation.cronSchedule} (
                  {automation.cronTimezone})
                </p>
                <p className="card-text">
                  <strong>Description:</strong> {automation.cronDescription}
                </p>
              </>
            )}
            {automation.triggerEndpoint && (
              <p className="card-text">
                <strong>Trigger Endpoint:</strong>{" "}
                <i>{automation.triggerEndpoint}</i>
              </p>
            )}
            <details open>
              <summary>View Details</summary>
              <div className="ps-4 py-2">
                {automation.fileName && (
                  <p className="card-text">
                    <strong>File Name:</strong> {automation.fileName}{" "}
                    {automation.fileSize && <small>({automation.fileSize})</small>}
                  </p>
                )}
                {automation.fileType && (
                  <p className="card-text">
                    <strong>File Type:</strong> {automation.fileType}
                  </p>
                )}
                {automation.fileLastModified && (
                  <p className="card-text">
                    <strong>Last Modified:</strong>{" "}
                    {new Date(automation.fileLastModified).toLocaleString()}
                  </p>
                )}
                {automation.fileChecksum && (
                  <p className="card-text">
                    <strong>Checksum:</strong> {automation.fileChecksum}
                  </p>
                )}
                {automation.fileUploadDate && (
                  <p className="card-text">
                    <strong>Upload Date:</strong>{" "}
                    {new Date(automation.fileUploadDate).toLocaleString()}
                  </p>
                )}
                <p className="card-text">
                  <strong>Next Run:</strong>{" "}
                  {automation.cronNextRun
                    ? new Date(automation.cronNextRun).toLocaleString()
                    : "N/A"}
                </p>
                <p className="card-text">
                  <strong>Last Run:</strong>
                </p>

                <div className="container">
                  <p className="card-text">
                    {automation.cronLastRun
                      ? new Date(automation.cronLastRun).toLocaleString()
                      : "N/A"}
                  </p>
                  {automation.cronLastRunDuration && automation.cronLastRunStatus !== 'pending' && (
                    <div className="progress mb-3">
                      <div
                        className={`progress-bar ${
                          automation.cronLastRunStatus === "success"
                            ? "bg-primary"
                            : automation.cronLastRunStatus === "failure"
                              ? "bg-danger"
                              : "bg-secondary" // for 'running' or other states
                        }`}
                        role="progressbar"
                        style={{
                          width: `${Math.min(
                            (parseFloat(automation.cronLastRunDuration) / 10) * // Assuming max duration of 10 units for 100%
                              100,
                            100
                          )}%`,
                        }}
                        aria-valuenow={parseFloat(automation.cronLastRunDuration)}
                        aria-valuemin={0}
                        aria-valuemax={10} 
                      >
                        {automation.cronLastRunDuration}
                      </div>
                    </div>
                  )}
                  {automation.cronLastRunError && (
                    <p className="card-text">
                      <strong className="text-capitalize">
                        {automation.cronLastRunStatus}:
                      </strong>{" "}
                      {automation.cronLastRunError}
                    </p>
                  )}
                  <p className="card-text">
                    <strong>Output:</strong> {automation.cronLastRunOutput}
                  </p>
                </div>
              </div>
            </details>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-primary"
                onClick={() => setEditAutomationId(automation.id)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteAutomation(automation.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
