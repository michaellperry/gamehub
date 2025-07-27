import { Join, Player, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';

export interface PlayerPlayground {
    playgroundCode: string;
    joinedAt: Date;
    playerCount: number;
}

export interface PlayerPlaygroundsViewModel {
    playgrounds: PlayerPlayground[] | null;
    error: string | null;
    loading: boolean;
    clearError: () => void;
}

// Specification to find all playgrounds that a player has joined
const playerPlaygroundsSpec = model.given(Player).match((player) =>
    Join.by(player)
        .selectMany(join => join.playground.predecessor()
            .select(playground => ({
                playgroundCode: playground.code,
                joinedAt: join.joinedAt,
                playground,
                playerHashes: Join.in(playground)
                    .selectMany(join => join.player.predecessor()
                        .select(player => j.hash(player)))
            }))
        )
);

export function usePlayerPlaygrounds(): PlayerPlaygroundsViewModel {
    const { player, error: playerError, loading: playerLoading, clearError: clearPlayerError } = usePlayer();

    // Use Jinaga to load all playgrounds the player has joined
    const { data: playerPlaygrounds, error: specificationError, loading: playgroundsLoading } = useSpecification(
        j,
        playerPlaygroundsSpec,
        player
    );

    // Convert the data to the expected format
    const playgrounds: PlayerPlayground[] | null = playerPlaygrounds ?
        playerPlaygrounds.map((playgroundData: Record<string, unknown>) => ({
            playgroundCode: playgroundData.playgroundCode as string,
            joinedAt: new Date(playgroundData.joinedAt as string),
            playerCount: new Set(playgroundData.playerHashes as string[]).size
        })) : null;

    const clearError = () => {
        clearPlayerError();
    };

    return {
        playgrounds,
        error: playerError || (specificationError ? specificationError.message : null),
        loading: playerLoading || playgroundsLoading,
        clearError,
    };
} 