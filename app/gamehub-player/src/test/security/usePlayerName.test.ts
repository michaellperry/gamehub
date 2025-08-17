import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlayerName } from '../../hooks/usePlayerName';
import { givenPlayerApp } from './givenPlayerApp';

describe('usePlayerName', () => {
    it('should show name input when player has no PlayerName facts', async () => {
        givenPlayerApp(() => []);

        const { result } = renderHook(() => usePlayerName());

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        const data = result.current.data!;

        expect(data.showNameInput).toBe(true);
        expect(data.playerName).toBe('');
        expect(data.allowCancel).toBe(false);
        expect(result.current.loading).toBe(false);
    });
});

