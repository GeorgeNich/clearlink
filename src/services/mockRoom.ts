import { cleanCode, generateCode, formatCode } from '../lib/code';
import type { CreateResult, JoinResult, Room, RoomService, ValidateResult } from './types';

export interface RoomScenario {
  /** What validating an invite code finds. */
  room: ValidateResult;
  /** Whether creating or joining succeeds once the user confirms. */
  connect: 'ok' | 'fail';
  /** Other people already in the room when you join. */
  present: number;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export function makeRoom(code: string): Room {
  return { code: formatCode(cleanCode(code)), inviteUrl: 'https://clearlink.example/#r/' + cleanCode(code), capacity: 5 };
}

/** Simulated rooms. Invitation URLs are navigation demos, not working video-call invitations. */
export class MockRoomService implements RoomService {
  scenario: RoomScenario = { room: 'ok', connect: 'ok', present: 0 };

  async validateRoom(_code: string): Promise<ValidateResult> {
    await wait(1100);
    return this.scenario.room;
  }

  async createRoom(): Promise<CreateResult> {
    await wait(1500);
    return this.scenario.connect === 'fail' ? { status: 'failed' } : { status: 'ok', room: makeRoom(generateCode()) };
  }

  /** Capacity and existence are checked again here, as the blueprint requires. */
  async joinRoom(code: string, _name: string): Promise<JoinResult> {
    await wait(1500);
    if (this.scenario.connect === 'fail') return { status: 'failed' };
    if (this.scenario.room !== 'ok') return { status: this.scenario.room };
    return { status: 'ok', room: makeRoom(code), others: this.scenario.present };
  }
}
