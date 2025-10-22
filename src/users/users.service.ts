import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    private users = [
        { id: 1, name: 'Roman' },
        { id: 2, name: 'Alice' },
    ];

    findAll() {
        return this.users;
    }
}
