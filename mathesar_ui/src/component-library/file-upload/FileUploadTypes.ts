export interface FileUpload {
  fileId: string;
  file: File;
}

export interface FileUploadProgress {
  state: string;
  progress?: number;
}

export interface FileUploadAddDetail {
  originalEvent: Event;
  added: FileUpload[];
  all: FileUpload[];
}
