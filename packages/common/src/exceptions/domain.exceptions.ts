/**
 * Domain exception base class.
 * Throw these from services; the HTTP filter will convert them.
 */
export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string, id?: string) {
    super(
      'RESOURCE_NOT_FOUND',
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      { resource, id },
    )
    this.name = 'ResourceNotFoundException'
  }
}

export class AccessDeniedException extends DomainException {
  constructor(action?: string) {
    super(
      'ACCESS_DENIED',
      action ? `Access denied: ${action}` : 'Access denied',
    )
    this.name = 'AccessDeniedException'
  }
}

export class BusinessRuleException extends DomainException {
  constructor(rule: string, details?: Record<string, unknown>) {
    super('BUSINESS_RULE_VIOLATION', rule, details)
    this.name = 'BusinessRuleException'
  }
}

export class ConflictException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, details)
    this.name = 'ConflictException'
  }
}

export class ValidationException extends DomainException {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', message, { field })
    this.name = 'ValidationException'
  }
}
