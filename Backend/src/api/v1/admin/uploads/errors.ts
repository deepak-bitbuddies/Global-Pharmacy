import { ValidationError } from "../../../../shared/errors/index.js"
import { REPORT_KIND_LABEL, type ReportKind } from "./parsers/parse-utils.js"

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

export class MissingDateError extends ValidationError {
  constructor(fileType: string) {
    super(`Could not find a valid date in the ${fileType} file's header — check the file format`)
  }
}

export class MultiDayFileError extends ValidationError {
  constructor(dateFrom: string, dateTo: string) {
    super(`This file covers ${dateFrom} to ${dateTo} — uploads must be for a single day. Export a one-day report from Marg and try again.`)
  }
}

/** Thrown when an upload violates the Stock -> Purchase -> Sales, one-date-at-a-time pipeline for a branch. */
export class OutOfSequenceError extends ValidationError {
  constructor(message: string) {
    super(message)
  }
}

/** Thrown when a file's own title row identifies it as a different report than the section it was uploaded under (e.g. a Purchase Register uploaded as Sales). */
export class WrongFileTypeError extends ValidationError {
  constructor(expectedKind: ReportKind, detectedKind: ReportKind) {
    super(`This file looks like a ${REPORT_KIND_LABEL[detectedKind]}, not a ${REPORT_KIND_LABEL[expectedKind]} — please upload it under the correct section.`)
  }
}
