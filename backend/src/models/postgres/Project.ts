import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../../config/database'
import { User } from './User'

export class Project extends Model {
  declare id: string
  declare userId: string
  declare name: string
  declare description: string | null
  declare presenceScore: number
  declare newMentionsCount: number
  declare totalMentionsCount: number
  declare mentionLimit: number
  declare mentionUsage: number
  declare keywords: object[]
  declare socialConnections: object
  declare settings: object
  declare createdAt: Date
  declare updatedAt: Date
  declare lastMentionAt: Date | null
}

Project.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    presenceScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    newMentionsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalMentionsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    mentionLimit: { type: DataTypes.INTEGER, defaultValue: 30000 },
    mentionUsage: { type: DataTypes.INTEGER, defaultValue: 0 },
    keywords: { type: DataTypes.JSONB, defaultValue: [] },
    socialConnections: { type: DataTypes.JSONB, defaultValue: {} },
    settings: { type: DataTypes.JSONB, defaultValue: {} },
    lastMentionAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['name', 'userId'], unique: true },
    ],
  }
)

// Associations
User.hasMany(Project, { foreignKey: 'userId', onDelete: 'CASCADE' })
Project.belongsTo(User, { foreignKey: 'userId' })
