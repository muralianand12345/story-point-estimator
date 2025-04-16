'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '../../../context/RoomContext';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import VotingCard from '../../../components/VotingCard';
import ParticipantCard from '../../../components/ParticipantCard';
import VotingResult from '../../../components/VotingResult';
import ShareRoom from '../../../components/ShareRoom';
import Button from '../../../components/Button';
import Logo from '../../../components/Logo';

const RoomPage = () => {
	const params = useParams();
	const router = useRouter();

	// Extract room ID from params
	const roomId = typeof params.id === 'string'
		? params.id
		: Array.isArray(params.id)
			? params.id[0]
			: '';

	const {
		room,
		participantId,
		submitVote,
		revealVotes,
		resetVotes,
		refreshRoom,
		error,
	} = useRoom();

	const [selectedVote, setSelectedVote] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);
	const initialSetupDone = useRef(false);
	const [isLoading, setIsLoading] = useState(true);

	// Set isClient to true once mounted
	useEffect(() => {
		setIsClient(true);
		setIsLoading(true);
	}, []);

	// Initial setup - fetch room data
	useEffect(() => {
		if (!roomId || !isClient) return;
		if (initialSetupDone.current) return;

		// Initial fetch of room data
		refreshRoom(roomId).then(() => {
			setIsLoading(false);
			initialSetupDone.current = true;
		}).catch(err => {
			console.error("Error refreshing room:", err);
			setIsLoading(false);
			initialSetupDone.current = true;
		});
	}, [roomId, refreshRoom, isClient]);

	// Update selected vote when room changes
	useEffect(() => {
		if (!room || !participantId) return;

		const participant = room.participants.find((p) => p.id === participantId);
		if (participant && participant.vote) {
			setSelectedVote(participant.vote);
		} else if (room.isRevealed === false) {
			// Reset selected vote when a new round starts
			setSelectedVote(null);
		}
	}, [room, participantId]);

	// Redirect if not in this room or room doesn't exist
	useEffect(() => {
		if (!isClient || isLoading) return;

		// If we have loaded and don't have room data, redirect to home
		if (!isLoading && !room) {
			console.log("No room data found, redirecting to home");
			router.push('/');
		}
	}, [room, router, isClient, isLoading]);

	// Handle vote selection
	const handleVoteSelect = (vote: string) => {
		if (!participantId) {
			console.error("Cannot vote: No participant ID");
			return;
		}

		setSelectedVote(vote);
		submitVote(vote);
	};

	// Handle reveal votes
	const handleRevealVotes = () => {
		revealVotes();
	};

	// Handle reset voting
	const handleResetVoting = () => {
		resetVotes();
		setSelectedVote(null);
	};

	// Show loading state
	if (isLoading || !isClient) {
		return (
			<div className="min-h-screen">
				<Header />
				<div className="flex flex-col items-center justify-center min-h-[60vh]">
					<Logo size="lg" className="mb-6" />
					<p className="text-lg text-gray-600 dark:text-gray-400">Loading room data...</p>
				</div>
			</div>
		);
	}

	// Show error if room not found
	if (!room) {
		return (
			<div className="min-h-screen">
				<Header />
				<main className="max-w-md mx-auto px-4 py-12">
					<Card>
						<h1 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-400">Room Not Found</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-6">
							The room you&apos;re trying to access doesn&apos;t exist or has been closed.
						</p>
						<Button
							onClick={() => router.push('/')}
							variant="primary"
						>
							Back to Home
						</Button>
					</Card>
				</main>
			</div>
		);
	}

	// Show error if there's a participant issue
	if (!participantId) {
		return (
			<div className="min-h-screen">
				<Header />
				<main className="max-w-md mx-auto px-4 py-12">
					<Card>
						<h1 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-400">Connection Issue</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-6">
							You&apos;re not properly connected to this room. Please try joining again.
						</p>
						<Button
							onClick={() => router.push(`/join/${roomId}`)}
							variant="primary"
						>
							Rejoin Room
						</Button>
					</Card>
				</main>
			</div>
		);
	}

	const isHost =
		room.participants.find((p) => p.id === participantId)?.isHost || false;
	const allVoted = room.participants.every((p) => p.vote !== null);

	return (
		<div className="min-h-screen">
			<Header />

			<main className="max-w-4xl mx-auto px-4 py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400">{room.name}</h1>
					{room.description && (
						<p className="text-gray-600 dark:text-gray-400 mt-1">{room.description}</p>
					)}
				</div>

				{error && (
					<div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<div className="grid md:grid-cols-3 gap-6">
					<div className="md:col-span-2">
						<Card>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-lg font-medium text-primary-700 dark:text-primary-400">
									Cast Your Vote
								</h2>

								{isHost && (
									<div className="flex space-x-2">
										{!room.isRevealed ? (
											<Button
												variant="primary"
												onClick={handleRevealVotes}
												disabled={!allVoted}
												className="whitespace-nowrap"
												fullWidth={false}
											>
												Reveal Votes
											</Button>
										) : (
											<Button
												variant="secondary"
												onClick={handleResetVoting}
												fullWidth={false}
												className="whitespace-nowrap"
											>
												Reset Voting
											</Button>
										)}
									</div>
								)}
							</div>

							<div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
								{room.votingOptions.map((option) => (
									<VotingCard
										key={option}
										value={option}
										selected={selectedVote === option}
										onClick={handleVoteSelect}
										disabled={room.isRevealed}
									/>
								))}
							</div>

							{room.isRevealed && (
								<VotingResult
									votes={room.participants.map((p) => p.vote)}
									votingOptions={room.votingOptions}
								/>
							)}
						</Card>
					</div>

					<div>
						{isHost && <ShareRoom roomId={room.id} />}

						<Card>
							<h2 className="text-lg font-medium mb-4 text-primary-700 dark:text-primary-400">
								Participants ({room.participants.length})
							</h2>

							<div className="space-y-2">
								{room.participants.map((participant) => (
									<ParticipantCard
										key={participant.id}
										name={participant.name}
										isHost={participant.isHost}
										hasVoted={participant.vote !== null}
										vote={participant.vote}
										isRevealed={room.isRevealed}
										isSelf={participant.id === participantId}
									/>
								))}
							</div>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}

export default RoomPage;