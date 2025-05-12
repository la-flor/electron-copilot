import { useState } from "react";
import { NewEditAutomation } from "../components/NewEditAutomation";

const data = [
  {
    id: 1,
    cronSchedule: "0 0 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at midnight",
    cronNextRun: "2023-10-01T00:00:00Z",
    cronLastRun: "2023-09-30T23:59:59Z",
    cronLastRunStatus: "success",
    cronLastRunError: null,
    cronLastRunDuration: "1s",
    cronLastRunOutput: "Automation 1 executed successfully",
    name: "Automation 1",
    description: "Check weather forcast and report key interests",
    status: "Active",
    fileName: "automation1.py",
    fileSize: "2MB",
    fileType: "Python Script",
    fileLastModified: "2023-09-30T23:59:59Z",
    fileChecksum: "abc123",
    fileDownloadLink: "http://example.com/download/automation1.py",
    fileUploadDate: "2023-09-30T23:59:59Z",
    triggerEndpoint: "http://example.com/automation/1",
  },
  {
    id: 2,
    cronSchedule: "0 12 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at noon",
    cronNextRun: "2023-10-01T12:00:00Z",
    cronLastRun: "2023-09-30T11:59:59Z",
    cronLastRunStatus: "failure",
    cronLastRunError: "Error executing automation 2",
    cronLastRunDuration: "2s",
    cronLastRunOutput: "Automation 2 failed",
    name: "Automation 2",
    description: "Check latest tech releases and summarize",
    status: "Inactive",
    fileName: "automation2.py",
    fileSize: "3MB",
    fileType: "Python Script",
    fileLastModified: "2023-09-30T11:59:59Z",
    fileChecksum: "def456",
    fileDownloadLink: "http://example.com/download/automation2.py",
    fileUploadDate: "2023-09-30T11:59:59Z",
    triggerEndpoint: null,
  },
  {
    id: 3,
    cronSchedule: "0 18 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at 6 PM",
    cronNextRun: "2023-10-01T18:00:00Z",
    cronLastRun: "2023-09-30T17:59:59Z",
    cronLastRunStatus: "success",
    cronLastRunError: null,
    cronLastRunDuration: "3s",
    cronLastRunOutput: "Automation 3 executed successfully",
    name: "Automation 3",
    description: "Report top todos on my list",
    status: "Active",
    fileName: "automation3.py",
    fileSize: "4MB",
    fileType: "Python Script",
    fileLastModified: "2023-09-30T17:59:59Z",
    fileChecksum: "ghi789",
    fileDownloadLink: "http://example.com/download/automation3.py",
    fileUploadDate: "2023-09-30T17:59:59Z",
    triggerEndpoint: "http://example.com/automation/3",
  },
];

export const Automations = () => {
  const [editAutomationId, setEditAutomationId] = useState(null);

  return (
    <div className="container d-flex flex-column gap-3 py-3">
      {editAutomationId && (
        <NewEditAutomation
          id={editAutomationId}
          onClose={() => setEditAutomationId(null)}
        />
      )}
      {data.map((automation) => (
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
                <p className="card-text">
                  <strong>File Name:</strong>{" "}
                  <a href={automation.fileDownloadLink} target="_blank">
                    {automation.fileName} <small>({automation.fileSize})</small>
                  </a>
                </p>
                <p className="card-text">
                  <strong>File Type:</strong> {automation.fileType}
                </p>
                <p className="card-text">
                  <strong>Last Modified:</strong>{" "}
                  {new Date(automation.fileLastModified).toLocaleString()}
                </p>
                <p className="card-text">
                  <strong>Checksum:</strong> {automation.fileChecksum}
                </p>
                <p className="card-text">
                  <strong>Upload Date:</strong>{" "}
                  {new Date(automation.fileUploadDate).toLocaleString()}
                </p>
                <p className="card-text">
                  <strong>Next Run:</strong>{" "}
                  {new Date(automation.cronNextRun).toLocaleString()}
                </p>
                <p className="card-text">
                  <strong>Last Run:</strong>
                </p>

                <div className="container">
                  <p className="card-text">
                    {new Date(automation.cronLastRun).toLocaleString()}
                  </p>
                  <div className="progress mb-3">
                    <div
                      className={`progress-bar ${
                        automation.cronLastRunStatus === "success"
                          ? "bg-primary"
                          : "bg-danger"
                      }`}
                      role="progressbar"
                      style={{
                        width: `${Math.min(
                          (parseFloat(automation.cronLastRunDuration) / 10) *
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
              <button className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
