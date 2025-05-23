import React from 'react';

const FileTransferStatus = ({ transfers, onCancelTransfer }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "sending":
      case "receiving":
        return "bg-blue-500"
      case "sent":
      case "received":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  const isTransferActive = (status) => {
    return status === "sending" || status === "receiving";
  }

  const handleCancel = (transferId) => {
    if (typeof onCancelTransfer === 'function') {
      console.log("Cancelling transfer from FileTransferStatus:", transferId);
      onCancelTransfer(transferId);
    } else {
      console.warn('onCancelTransfer prop is not provided to FileTransferStatus');
    }
  };

  return (
    <div className="space-y-4">
      {Object.values(transfers).map((transfer) => (
        <div key={transfer.id} className="border rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">
              {transfer.fileName || (transfer.file && transfer.file.name) || "Unknown file"}
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(transfer.status)} mr-2`}></div>
              <span className="text-sm text-gray-600 capitalize">{transfer.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="text-sm text-gray-500 mr-2">
                {transfer.fileSize && formatFileSize(transfer.fileSize)}
                {transfer.file && formatFileSize(transfer.file.size)}
              </div>
              {transfer.status !== "cancelled" && (
                <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Encrypted
                </div>
              )}
            </div>
            
            {/* Cancel button - only show for active transfers and if onCancelTransfer exists */}
            {isTransferActive(transfer.status) && typeof onCancelTransfer === 'function' && (
              <button
                onClick={() => handleCancel(transfer.id)}
                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
            )}
          </div>

          {transfer.status !== "cancelled" && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`${transfer.status === "error" ? "bg-red-600" : "bg-blue-600"} h-2.5 rounded-full`} 
                  style={{ width: `${transfer.progress}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">{transfer.progress}%</div>
            </>
          )}
          
          {transfer.status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mt-2">
              Transfer cancelled
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

FileTransferStatus.defaultProps = {
  onCancelTransfer: null
};

export default FileTransferStatus;