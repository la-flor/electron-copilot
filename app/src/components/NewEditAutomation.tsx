import React, { FormEvent, useState } from "react";
import { Automation } from "../../shared/interfaces/database.interface";

type AutomationCreationData = Omit<Automation, "id" | "create_time" | "update_time" | "delete_time">;

interface NewEditAutomationProps {
  id: number | null;
  onClose: () => void;
}

export const NewEditAutomation = ({ id, onClose }: NewEditAutomationProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cronSchedule, setCronSchedule] = useState("");
  // TODO: Add state and handling for file upload if needed

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (id === null) { // Only handle new automation creation
      const newAutomationData: AutomationCreationData = {
        name,
        description,
        cronSchedule,
        cronTimezone: "UTC", // Default value
        cronDescription: "", // Default or derive if necessary
        cronNextRun: "", // Will be set by scheduler or backend logic
        cronLastRun: "", // Will be set by scheduler or backend logic
        cronLastRunStatus: "pending", // Initial status
        cronLastRunError: null,
        cronLastRunDuration: "", 
        cronLastRunOutput: "",
        status: "Inactive", // Default status
        fileName: null, // Will be set if file is uploaded
        fileSize: null,
        fileType: null,
        fileLastModified: null,
        fileChecksum: null,
        fileUploadDate: null,
        triggerEndpoint: null, // Set if applicable
      };

      try {
        const result = await window.db.automation.addAutomation(newAutomationData);
        if (result.success) {
          console.log("New automation added:", result.automation);
          handleClose();
        } else {
          console.error("Failed to add automation:", result.message);
          // TODO: Show error message to user
        }
      } catch (error) {
        console.error("Error submitting automation:", error);
        // TODO: Show error message to user
      }
    } else {
      // Handle edit automation logic here if needed in the future
      console.log("Edit form submitted for ID:", id);
      handleClose();
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {id ? "Edit Automation" : "New Automation"}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleClose}
            ></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="cronSchedule" className="form-label">
                  Cron Schedule
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cronSchedule"
                  value={cronSchedule}
                  onChange={(e) => setCronSchedule(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="fileUpload" className="form-label">
                  Upload File
                </label>
                <input type="file" className="form-control" id="fileUpload" />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
