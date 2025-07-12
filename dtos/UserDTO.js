class UserDTO {
  constructor(user) {
    this.id = user._id;
    this.email = user.email;
    this.role = user.role;
    this.memberRef = user.memberRef;
    this.isVerified = user.isVerified;
    this.createdAt = user.createdAt;
  }

  static fromUser(user) {
    return new UserDTO(user);
  }

  static fromUsers(users) {
    return users.map((user) => new UserDTO(user));
  }
}

module.exports = UserDTO;
