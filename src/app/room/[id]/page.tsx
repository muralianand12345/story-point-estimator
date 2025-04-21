'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocketRoom } from '../../../context/WebSocketRoomContext';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import VotingCard from '../../../components/VotingCard';
import ParticipantList from '../../../components/ParticipantList';
import VotingResult from '../../../components/VotingResult';
import ShareRoom from '../../../components/ShareRoom';
import Button from '../../../components/Button';
import Logo from '../../../components/Logo';
import { ConnectionStatus } from '../../../lib/websocket';

const RoomPage = () => {
	const params = useParams();
	const router = useRouter();

	// Extract room ID from params
	const roomId = typeof params.id === 'string'
		? params.id
		: Array.isArray(params.id)
			? params.id[0]
			: '';

	const formattedRoomId = roomId.trim().toUpperCase();

	const {
		room,
		participantId,
		submitVote,
		revealVotes,
		resetVotes,
		refreshRoom,
		joinRoom,
		error,
		connectionStatus,
		isConnected
	} = useWebSocketRoom();

	const [selectedVote, setSelectedVote] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);
	const initialSetupDone = useRef(false);
	const [isLoading, setIsLoading] = useState(true);
	const [reconnectAttempt, setReconnectAttempt] = useState(0);
	const [isRejoining, setIsRejoining] = useState(false);

	// Set isClient to true once mounted
	useEffect(() => {
		setIsClient(true);
		setIsLoading(true);
	}, []);

	// Initial setup - fetch room data
	useEffect(() => {
		if (!formattedRoomId || !isClient) return;
		if (initialSetupDone.current) return;

		// Initial fetch of room data
		refreshRoom(formattedRoomId).then(() => {
			setIsLoading(false);
			initialSetupDone.current = true;
		}).catch(err => {
			console.error("Error refreshing room:", err);
			setIsLoading(false);
			initialSetupDone.current = true;
		});
	}, [formattedRoomId, refreshRoom, isClient]);

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

	// Attempt automatic rejoin if we have a room but no participantId
	useEffect(() => {
		if (!isClient || isLoading || !room || participantId || isRejoining) return;

		const storedParticipantName = localStorage.getItem('participantName');
		const storedRoomId = localStorage.getItem('currentRoomId');

		// Only auto-rejoin if the stored room ID matches the current room
		if (storedParticipantName && storedRoomId === formattedRoomId) {
			console.log("Attempting automatic rejoin with stored name:", storedParticipantName);
			setIsRejoining(true);
			handleRejoin();
		}
	}, [isClient, isLoading, room, participantId, formattedRoomId]);

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

	// Handle rejoin attempt
	const handleRejoin = async () => {
		if (!room) return;

		// Get participant name from localStorage if possible
		const storedParticipantName = localStorage.getItem('participantName');
		if (!storedParticipantName) {
			// If we don't have the name stored, redirect to join page
			router.push(`/join/${formattedRoomId}`);
			return;
		}

		setReconnectAttempt(prev => prev + 1);
		setIsRejoining(true);

		try {
			const success = await joinRoom(formattedRoomId, storedParticipantName);
			if (success) {
				// Force refresh after successful rejoin
				await refreshRoom(formattedRoomId);
			} else {
				// If we couldn't rejoin with the same name, redirect to join page
				router.push(`/join/${formattedRoomId}`);
			}
		} catch (error) {
			console.error("Error during rejoin:", error);
		} finally {
			setIsRejoining(false);
		}
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

	// Show connection issue banner
	const showConnectionIssue = connectionStatus === ConnectionStatus.DISCONNECTED || 
	                            connectionStatus === ConnectionStatus.RECONNECTING;

	// Show participant connection issue with rejoin option
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
						<div className="flex space-x-4">
							<Button
								onClick={handleRejoin}
								variant="primary"
								className="flex-1"
								disabled={isRejoining || reconnectAttempt > 3}
							>
								{isRejoining ? 'Rejoining...' : 'Rejoin Room'}
							</Button>
							<Button
								onClick={() => router.push(`/join/${formattedRoomId}`)}
								variant="outline"
								className="flex-1"
							>
								Join With New Name
							</Button>
						</div>
						{reconnectAttempt > 3 && (
							<p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
								Multiple rejoin attempts failed. You may need to join with a new name.
							</p>
						)}
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
				{showConnectionIssue && (
					<div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-6">
						<p className="flex items-center">
							<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
							</svg>
							{connectionStatus === ConnectionStatus.RECONNECTING ? 
								'Reconnecting to server...' : 
								'Connection lost. Real-time updates are disabled. Try refreshing the page.'}
						</p>
					</div>
				)}

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
												disabled={!allVoted || !isConnected}
												className="whitespace-nowrap"
												fullWidth={false}
											>
												Reveal Votes
											</Button>
										) : (
											<Button
												variant="secondary"
												onClick={handleResetVoting}
												disabled={!isConnected}
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
										disabled={room.isRevealed || !isConnected}
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

							<ParticipantList
								participants={room.participants}
								isRevealed={room.isRevealed}
								participantId={participantId}
							/>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}

export default RoomPage;