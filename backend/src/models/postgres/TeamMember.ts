import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../../config/database'
import { Project } from './Project'
import { User } from './User'

export class TeamMember extends Model {
  declare id: string
  declare projectId: string
  declare userId: string
  declare role: string
  declare createdAt: Date
}

TeamMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Project, key: 'id' },
    },
    userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
    role: {
      type: DataTypes.ENUM('admin', 'project_manager', 'analyst', 'viewer'),
      defaultValue: 'viewer',
    },
  },
  {
    sequelize,
    tableName: 'team_members',
    timestamps: true,
    indexes: [{ fields: ['projectId', 'userId'], unique: true }],
  }
)

Project.hasMany(TeamMember, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'teamMembers' })
TeamMember.belongsTo(Project, { foreignKey: 'projectId' })
TeamMember.belongsTo(User, { foreignKey: 'userId' })
