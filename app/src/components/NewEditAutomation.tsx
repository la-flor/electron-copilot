import React, { FormEvent } from "react";

interface NewEditAutomationProps {
  id: number | null;
  onClose: () => void;
}

export const NewEditAutomation = ({ id, onClose }: NewEditAutomationProps) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted");
    handleClose();
  };

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New/Edit Automation</h5>
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
                <input type="text" className="form-control" id="name" />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea className="form-control" id="description"></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="cronSchedule" className="form-label">
                  Cron Schedule
                </label>
                <input type="text" className="form-control" id="cronSchedule" />
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
