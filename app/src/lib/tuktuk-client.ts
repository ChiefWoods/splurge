import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';
import { Connection } from '@solana/web3.js';
import tuktukIdl from '@/idl/tuktuk.json';
import { ProgramClient } from './program-client';

export class TuktukClient extends ProgramClient<Tuktuk> {
  constructor(connection: Connection) {
    super(connection, tuktukIdl);
  }
}
