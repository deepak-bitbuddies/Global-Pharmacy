import { ValidationError } from "../../../../shared/errors/index.js"

export class MissingFileError extends ValidationError {
  constructor() {
    super("No file was uploaded")
  }
}

export class EmptyImportError extends ValidationError {
  constructor(fileType: string) {
    super(`Parsed 0 rows from the uploaded ${fileType} file — check the file format`)
  }
}
