export interface UserRegisteredEvent {
  eventName: 'user.registered'
  userId: string
  email: string
  firstName: string
  lastName: string
  timestamp: Date
}

export interface UserVerifiedEvent {
  eventName: 'user.verified'
  userId: string
  email: string
  timestamp: Date
}

export interface UserBannedEvent {
  eventName: 'user.banned'
  userId: string
  reason: string
  bannedBy: string
  timestamp: Date
}
