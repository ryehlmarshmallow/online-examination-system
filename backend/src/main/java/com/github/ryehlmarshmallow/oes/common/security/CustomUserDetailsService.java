package com.github.ryehlmarshmallow.oes.common.security;

import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @NonNull
    public UserDetails loadUserByUsername(@NonNull String identifier) throws UsernameNotFoundException {
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier.trim(), identifier.trim())
            .map(CustomUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));
    }
}
