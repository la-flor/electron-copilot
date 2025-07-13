import { FormEvent, useState, useEffect, ChangeEvent } from "react";
import { Automation } from "../shared/interfaces/database.interface";

type AutomationCreationPayload = Omit<
  Automation,
  "id" | "create_time" | "update_time" | "delete_time"
>;

type AutomationUpdatePayload = Partial<
  Omit<Automation, "create_time" | "update_time" | "delete_time">
> &
  Pick<Automation, "id">;

interface NewEditAutomationProps {
  id: number | null;
  automationToEdit?: Automation | null; // Pass the full automation object for editing
  onClose: () => void;
}

export const NewEditAutomation = ({
  id,
  automationToEdit,
  onClose,
}: NewEditAutomationProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cronSchedule, setCronSchedule] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // TODO: Add state and handling for other editable fields like status, timezone, etc.

  useEffect(() => {
    if (automationToEdit && id !== null) {
      setName(automationToEdit.name);
      setDescription(automationToEdit.description || "");
      setCronSchedule(automationToEdit.cronSchedule || "");
      // TODO: Populate other form fields if they are added
    } else {
      // Reset form for new automation
      setName("");
      setDescription("");
      setCronSchedule("");
      setSelectedFile(null);
      // Reset file input visually
      const fileInput = document.getElementById(
        "fileUpload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }, [id, automationToEdit]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (id === null) {
      // Create new automation
      const newAutomationData: AutomationCreationPayload & { file: ArrayBuffer } = {
        name,
        description,
        cronSchedule,
        cronTimezone: "UTC",
        cronDescription: "", // Default or derive if necessary
        cronNextRun: "", // Will be set by scheduler or backend logic
        cronLastRun: "", // Will be set by scheduler or backend logic
        cronLastRunStatus: "pending",
        cronLastRunError: null,
        cronLastRunDuration: "",
        cronLastRunOutput: "",
        status: "Inactive",
        triggerEndpoint: null,
        // File related fields
        // ...(selectedFile
        //   ? {
        //       file: await selectedFile.arrayBuffer(),
        //       fileName: selectedFile.name,
        //       fileSize: selectedFile.size,
        //       fileType: selectedFile.type,
        //       fileLastModified: new Date(
        //         selectedFile.lastModified
        //       ).toISOString(),
        //       // Signal backend to re-calculate checksum and update upload date for the new file
        //       fileChecksum: null,
        //       fileUploadDate: null,
        //     }
        //   : {}),
        fileName: selectedFile?.name ?? null,
        fileSize: selectedFile?.size ?? null,
        fileType: selectedFile?.type ?? null,
        fileLastModified: selectedFile
          ? new Date(selectedFile.lastModified).toISOString()
          : null,
        fileChecksum: null, // Backend will calculate this
        fileUploadDate: null, // Backend will set this
        file: await selectedFile.arrayBuffer(),
      };

      try {
        const result = await window.db.automation.addAutomation(
          newAutomationData
        );
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
    } else if (id !== null) {
      // Update existing automation
      const updatedAutomationData: AutomationUpdatePayload & { file?: ArrayBuffer } = {
        id,
        name,
        description,
        cronSchedule,
        ...(selectedFile
          ? {
              file: await selectedFile.arrayBuffer(),
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              fileLastModified: new Date(
                selectedFile.lastModified
              ).toISOString(),
              // Signal backend to re-calculate checksum and update upload date for the new file
              fileChecksum: null,
              fileUploadDate: null,
            }
          : {}),
        // TODO: Include other fields that are editable (e.g. status)
      };

      try {
        const result = await window.db.automation.updateAutomation(
          updatedAutomationData
        );
        if (result.success) {
          console.log("Automation updated:", result.automation);
          handleClose();
        } else {
          console.error("Failed to update automation:", result.message);
          // TODO: Show error message to user
        }
      } catch (error) {
        console.error("Error updating automation:", error);
        // TODO: Show error message to user
      }
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
                  Upload File {selectedFile && `(${selectedFile.name})`}
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="fileUpload"
                  onChange={handleFileChange}
                />
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
