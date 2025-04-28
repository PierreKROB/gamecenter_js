import Permission from '~/models/permissionModel';
import Role from '~/models/roleModel';

import logger from './logger';

async function initialData() {
    try {
        const countPermissions = await Permission.estimatedDocumentCount();
        if (countPermissions === 0) {
            await Permission.create(
                {
                    controller: 'user',
                    action: 'create'
                },
                {
                    controller: 'user',
                    action: 'read'
                },
                {
                    controller: 'user',
                    action: 'update'
                },
                {
                    controller: 'user',
                    action: 'delete'
                },
                {
                    controller: 'role',
                    action: 'create'
                },
                {
                    controller: 'role',
                    action: 'read'
                },
                {
                    controller: 'role',
                    action: 'update'
                },
                {
                    controller: 'role',
                    action: 'delete'
                },

            );
        }
        const countRoles = await Role.estimatedDocumentCount();
        if (countRoles === 0) {
            const permissionsSuperAdministrator = await Permission.find();
            const permissionsAdministrator = await Permission.find({ controller: 'user' });
            const permissionsModerator = await Permission.find({ controller: 'user', action: { $ne: 'delete' } });
            await Role.create(
                {
                    name: 'Super Administrator',
                    permissions: permissionsSuperAdministrator
                },
                {
                    name: 'Administrator',
                    permissions: permissionsAdministrator
                },
                {
                    name: 'Moderator',
                    permissions: permissionsModerator
                },
                {
                    name: 'User',
                    permissions: []
                }
            );
        }
        //we can add default users here
    } catch (err) {
        logger.error(err);
    }
    
}

export default initialData;