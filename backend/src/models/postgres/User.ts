import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../../config/database'

export class User extends Model {
  declare id: string
  declare email: string
  declare passwordHash: string
  declare name: string
  declare avatarUrl: string | null
  declare role: string
  declare subscriptionTier: string
  declare isEmailVerified: boolean
  declare createdAt: Date
  declare updatedAt: Date
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'analyst', 'viewer'),
      defaultValue: 'owner',
    },
    subscriptionTier: {
      type: DataTypes.ENUM('trial', 'standard', 'professional', 'enterprise'),
      defaultValue: 'trial',
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
)
